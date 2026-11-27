package vn.edu.fit.yitzone.iam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.ScopeContextHolder;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Delegated scoped/TTL permission grants and instant <= 5s revocation via Redis Pub/Sub (UC-IAM-10, FR-RBAC-03..05, Edge 30).
 */
@Service
public class RbacGrantService {
    private static final Logger log = LoggerFactory.getLogger(RbacGrantService.class);

    private final UserRepository userRepository;
    private final PermissionModuleRepository permissionModuleRepository;
    private final RbacCacheInvalidationService rbacCacheService;
    private final EffectivePermissionService effectivePermissionService;
    private final AuditLogService auditLogService;
    private final MongoTemplate mongoTemplate;

    public RbacGrantService(
            UserRepository userRepository,
            PermissionModuleRepository permissionModuleRepository,
            RbacCacheInvalidationService rbacCacheService,
            EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) AuditLogService auditLogService,
            @Autowired(required = false) MongoTemplate mongoTemplate
    ) {
        this.userRepository = userRepository;
        this.permissionModuleRepository = permissionModuleRepository;
        this.rbacCacheService = rbacCacheService;
        this.effectivePermissionService = effectivePermissionService;
        this.auditLogService = auditLogService;
        this.mongoTemplate = mongoTemplate;
    }

    public List<GrantView> listActiveGrants() {
        Instant now = Instant.now();
        List<GrantView> result = new ArrayList<>();
        for (User user : userRepository.findAll()) {
            if (user.getAssignedModules() == null || user.getAssignedModules().isEmpty()) {
                continue;
            }
            for (User.AssignedModule am : user.getAssignedModules()) {
                if (am.expiresAt() != null && !now.isBefore(am.expiresAt())) {
                    continue;
                }
                result.add(new GrantView(
                        user.getId() + ":" + am.moduleCode() + ":" + am.scopeId(),
                        user.getId(),
                        user.getStudentCode() != null ? user.getStudentCode() : user.getEmail(),
                        user.getFullName() != null ? user.getFullName() : user.getEmail(),
                        am.moduleCode(),
                        am.scopeType(),
                        am.scopeId(),
                        am.expiresAt()
                ));
            }
        }
        return result;
    }

    public GrantView grantModule(GrantRequest request, Authentication grantor) {
        PermissionModule module = permissionModuleRepository.findByModuleCode(request.moduleCode())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy gói quyền: " + request.moduleCode()));

        if (!module.isActive()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Gói quyền " + module.getModuleCode() + " đang ở trạng thái tạm ngưng, không thể cấp phát");
        }

        boolean isBtv = hasAuthority(grantor, "ROLE_STANDING_COMMITTEE");
        if (module.isNonDelegable() && !isBtv) {
            recordAudit(
                    grantor.getName(),
                    "RBAC_PRIVILEGE_ESCALATION_BLOCKED",
                    "PERMISSION_MODULE",
                    module.getModuleCode(),
                    List.of(new AuditLog.ChangedField("targetIdentifier", null, request.targetIdentifier())),
                    "Cố gắng ủy quyền gói Non-delegable " + module.getModuleCode() + " khi không phải BTV"
            );
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Từ chối 403: Gói quyền " + module.getModuleCode() + " thuộc nhóm Non-delegable chỉ BTV mới có thẩm quyền cấp phát (FR-RBAC-05)");
        }

        if (!isBtv) {
            if (!hasAuthority(grantor, module.getModuleCode())) {
                recordAudit(
                        grantor.getName(),
                        "RBAC_PRIVILEGE_ESCALATION_BLOCKED",
                        "PERMISSION_MODULE",
                        module.getModuleCode(),
                        List.of(new AuditLog.ChangedField("scopeId", null, request.scopeId())),
                        "Cố gắng cấp gói quyền vượt thẩm quyền bản thân đang nắm giữ"
                );
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Không thể cấp gói quyền mà chính bạn không sở hữu trong phạm vi mục tiêu (FR-RBAC-05)");
            }
            Set<String> grantorScopes = ScopeContextHolder.getAllowedScopes();
            if (!grantorScopes.contains(request.scopeId()) && !grantorScopes.contains("FACULTY")) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Không thể cấp quyền ngoài phạm vi đơn vị bạn quản lý (" + request.scopeId() + ")");
            }
        }

        User targetUser = resolveTargetUser(request.targetIdentifier());
        String scopeType = request.scopeType() == null || request.scopeType().isBlank() ? "COMMITTEE" : request.scopeType().trim();
        String scopeId = request.scopeId().trim();

        List<User.AssignedModule> updated = new ArrayList<>(targetUser.getAssignedModules() == null ? List.of() : targetUser.getAssignedModules());
        updated.removeIf(am -> Objects.equals(am.moduleCode(), module.getModuleCode()) && Objects.equals(am.scopeId(), scopeId));
        updated.add(new User.AssignedModule(module.getModuleCode(), scopeType, scopeId, request.expiresAt()));
        targetUser.setAssignedModules(updated);

        long newPermVer = bumpPermissionVersionAndSave(targetUser);
        effectivePermissionService.evictLocalCache(targetUser.getId());
        rbacCacheService.invalidateUserPermissions(targetUser.getId(), newPermVer);

        recordAudit(
                grantor.getName(),
                "RBAC_GRANT_CREATED",
                "USER",
                targetUser.getId(),
                List.of(
                        new AuditLog.ChangedField("moduleCode", null, module.getModuleCode()),
                        new AuditLog.ChangedField("scopeId", null, scopeId),
                        new AuditLog.ChangedField("expiresAt", null, request.expiresAt())
                ),
                request.reason() == null || request.reason().isBlank()
                        ? "Cấp gói quyền " + module.getModuleCode() + " phạm vi " + scopeId
                        : request.reason()
        );

        return new GrantView(
                targetUser.getId() + ":" + module.getModuleCode() + ":" + scopeId,
                targetUser.getId(),
                targetUser.getStudentCode() != null ? targetUser.getStudentCode() : targetUser.getEmail(),
                targetUser.getFullName() != null ? targetUser.getFullName() : targetUser.getEmail(),
                module.getModuleCode(),
                scopeType,
                scopeId,
                request.expiresAt()
        );
    }

    public void revokeModule(String userId, String moduleCode, String scopeId, String reason, Authentication actor) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng: " + userId));

        List<User.AssignedModule> current = new ArrayList<>(targetUser.getAssignedModules() == null ? List.of() : targetUser.getAssignedModules());
        boolean removed = current.removeIf(am -> Objects.equals(am.moduleCode(), moduleCode)
                && (scopeId == null || scopeId.isBlank() || Objects.equals(am.scopeId(), scopeId)));
        if (!removed) {
            throw new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                    "Không tìm thấy gói quyền đang cấp cần thu hồi");
        }
        targetUser.setAssignedModules(current);

        long newPermVer = bumpPermissionVersionAndSave(targetUser);
        effectivePermissionService.evictLocalCache(targetUser.getId());
        rbacCacheService.invalidateUserPermissions(targetUser.getId(), newPermVer);

        recordAudit(
                actor.getName(),
                "RBAC_GRANT_REVOKED",
                "USER",
                targetUser.getId(),
                List.of(
                        new AuditLog.ChangedField("moduleCode", moduleCode, null),
                        new AuditLog.ChangedField("scopeId", scopeId, null),
                        new AuditLog.ChangedField("permissionVersion", newPermVer - 1, newPermVer)
                ),
                reason == null || reason.isBlank() ? "Thu hồi tức thì gói quyền " + moduleCode : reason
        );
    }

    @Scheduled(fixedDelay = 60_000L)
    public void cleanupExpiredGrants() {
        try {
            Instant now = Instant.now();
            for (User user : userRepository.findAll()) {
                if (user.getAssignedModules() == null || user.getAssignedModules().isEmpty()) {
                    continue;
                }
                List<User.AssignedModule> remaining = user.getAssignedModules().stream()
                        .filter(am -> am.expiresAt() == null || now.isBefore(am.expiresAt()))
                        .toList();
                if (remaining.size() != user.getAssignedModules().size()) {
                    user.setAssignedModules(new ArrayList<>(remaining));
                    long newVer = bumpPermissionVersionAndSave(user);
                    effectivePermissionService.evictLocalCache(user.getId());
                    rbacCacheService.invalidateUserPermissions(user.getId(), newVer);
                    log.info("Auto-revoked expired RBAC grants for userId={}, newPermVer={}", user.getId(), newVer);
                }
            }
        } catch (Exception ex) {
            log.debug("Skipped scheduled RBAC expired grant cleanup: {}", ex.getMessage());
        }
    }

    private User resolveTargetUser(String identifier) {
        String clean = identifier == null ? "" : identifier.trim();
        return userRepository.findByStudentCode(clean)
                .or(() -> userRepository.findByEmail(clean.toLowerCase()))
                .or(() -> userRepository.findById(clean))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản tương ứng với MSSV/Email: " + clean));
    }

    private long bumpPermissionVersionAndSave(User user) {
        if (mongoTemplate != null && user.getId() != null) {
            Query query = Query.query(Criteria.where("_id").is(user.getId()));
            Update update = new Update()
                    .set("assignedModules", user.getAssignedModules())
                    .inc("permissionVersion", 1L);
            User updated = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    User.class
            );
            if (updated != null) {
                return updated.getPermissionVersion();
            }
        }
        long nextVer = user.getPermissionVersion() + 1L;
        user.setPermissionVersion(nextVer);
        userRepository.save(user);
        return nextVer;
    }

    private boolean hasAuthority(Authentication auth, String authority) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    private void recordAudit(
            String actorId,
            String action,
            String targetType,
            String targetId,
            List<AuditLog.ChangedField> fields,
            String reason
    ) {
        if (auditLogService != null) {
            auditLogService.record(actorId, null, action, targetType, targetId, fields, reason, null, null);
        }
    }

    public record GrantRequest(
            String targetIdentifier,
            String moduleCode,
            String scopeType,
            String scopeId,
            Instant expiresAt,
            String reason
    ) {
    }

    public record GrantView(
            String id,
            String userId,
            String userCode,
            String userName,
            String moduleCode,
            String scopeType,
            String scopeId,
            Instant expiresAt
    ) {
    }
}
