package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.AtomicPermissionCatalog;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Manages the 20 standard + custom Business Permission Modules and enforces SRS FR-RBAC-02 security invariants (UC-IAM-09).
 */
@Service
public class PermissionModuleService {
    private static final Set<String> SENSITIVE_SEPARATED_PERMS = Set.of("liveqa:moderate", "liveqa:unmask");
    private static final Pattern MODULE_CODE_PATTERN = Pattern.compile("^MOD_[A-Z0-9_]{3,40}$");

    private final PermissionModuleRepository permissionModuleRepository;
    private final UserRepository userRepository;
    private final EffectivePermissionService effectivePermissionService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final AuditLogService auditLogService;

    public PermissionModuleService(PermissionModuleRepository permissionModuleRepository) {
        this(permissionModuleRepository, null, null, null, null);
    }

    @Autowired
    public PermissionModuleService(
            PermissionModuleRepository permissionModuleRepository,
            @Autowired(required = false) UserRepository userRepository,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.permissionModuleRepository = permissionModuleRepository;
        this.userRepository = userRepository;
        this.effectivePermissionService = effectivePermissionService;
        this.rbacCacheService = rbacCacheService;
        this.auditLogService = auditLogService;
    }

    public List<PermissionModule> listAll() {
        return listAll(true);
    }

    public List<PermissionModule> listAll(boolean includeInactive) {
        List<PermissionModule> all = permissionModuleRepository.findAll();
        if (includeInactive) {
            return all;
        }
        return all.stream().filter(PermissionModule::isActive).toList();
    }

    public List<AtomicPermissionCatalog.PermissionDefinition> listAtomicPermissions() {
        return AtomicPermissionCatalog.listAll();
    }

    public PermissionModule saveModule(PermissionModule module) {
        validateInvariants(module, null);
        return permissionModuleRepository.save(module);
    }

    public PermissionModule createModule(CreateModuleCommand cmd, Authentication actor) {
        String normalizedCode = normalizeModuleCode(cmd.moduleCode());
        if (permissionModuleRepository.findByModuleCode(normalizedCode).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Mã gói quyền đã tồn tại: " + normalizedCode);
        }

        List<String> cleanedPerms = normalizePermissions(cmd.includedPermissions());
        if (cleanedPerms.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Gói quyền mới phải bao gồm ít nhất 01 quyền nguyên tử hợp lệ");
        }

        PermissionModule module = new PermissionModule();
        module.setModuleCode(normalizedCode);
        module.setName(normalizeRequiredText(cmd.name(), "Tên gói quyền không được để trống"));
        module.setDescription(cmd.description() == null ? "" : cmd.description().trim());
        module.setIncludedPermissions(cleanedPerms);
        module.setNonDelegable(cmd.nonDelegable());
        module.setSystemDefault(false);
        module.setActive(true);
        Instant now = Instant.now();
        module.setCreatedAt(now);
        module.setUpdatedAt(now);
        module.setUpdatedBy(actor != null ? actor.getName() : "SYSTEM");

        validateInvariants(module, actor);
        PermissionModule saved = permissionModuleRepository.save(module);

        recordAudit(
                actor,
                "RBAC_MODULE_CREATED",
                saved.getModuleCode(),
                List.of(
                        new AuditLog.ChangedField("name", null, saved.getName()),
                        new AuditLog.ChangedField("nonDelegable", null, saved.isNonDelegable()),
                        new AuditLog.ChangedField("includedPermissions", null, saved.getIncludedPermissions())
                ),
                cmd.reason() == null || cmd.reason().isBlank()
                        ? "Tạo gói quyền tùy chỉnh " + saved.getModuleCode()
                        : cmd.reason().trim()
        );
        return saved;
    }

    public PermissionModule updateModule(String moduleCode, UpdateModuleCommand cmd, Authentication actor) {
        String normalizedCode = normalizeModuleCode(moduleCode);
        PermissionModule existing = permissionModuleRepository.findByModuleCode(normalizedCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy gói quyền: " + normalizedCode));

        List<String> oldPerms = existing.getIncludedPermissions() == null
                ? List.of()
                : List.copyOf(existing.getIncludedPermissions());
        boolean oldActive = existing.isActive();
        boolean oldNonDelegable = existing.isNonDelegable();
        String oldName = existing.getName();

        if (existing.isSystemDefault()) {
            if (cmd.active() != null && !cmd.active()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Không được tạm ngưng gói quyền mặc định hệ thống: " + normalizedCode);
            }
            if (cmd.includedPermissions() != null) {
                List<String> requestedPerms = normalizePermissions(cmd.includedPermissions());
                if (!Set.copyOf(requestedPerms).equals(Set.copyOf(oldPerms))) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                            "Không được thay đổi cấu trúc quyền lõi của 20 gói mặc định hệ thống (" + normalizedCode + "). Hãy tạo gói quyền tùy chỉnh mới nếu cần biến thể riêng.");
                }
            }
            if (cmd.nonDelegable() != null && cmd.nonDelegable() != oldNonDelegable) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Không được thay đổi cờ Non-delegable của gói mặc định hệ thống: " + normalizedCode);
            }
            if (cmd.name() != null && !cmd.name().isBlank()) {
                existing.setName(cmd.name().trim());
            }
            if (cmd.description() != null) {
                existing.setDescription(cmd.description().trim());
            }
        } else {
            if (cmd.name() != null && !cmd.name().isBlank()) {
                existing.setName(cmd.name().trim());
            }
            if (cmd.description() != null) {
                existing.setDescription(cmd.description().trim());
            }
            if (cmd.includedPermissions() != null) {
                List<String> cleanedPerms = normalizePermissions(cmd.includedPermissions());
                if (cleanedPerms.isEmpty()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                            "Gói quyền phải bao gồm ít nhất 01 quyền nguyên tử hợp lệ");
                }
                existing.setIncludedPermissions(cleanedPerms);
            }
            if (cmd.nonDelegable() != null) {
                existing.setNonDelegable(cmd.nonDelegable());
            }
            if (cmd.active() != null) {
                existing.setActive(cmd.active());
            }
        }

        existing.setUpdatedAt(Instant.now());
        existing.setUpdatedBy(actor != null ? actor.getName() : "SYSTEM");

        validateInvariants(existing, actor);
        PermissionModule saved = permissionModuleRepository.save(existing);

        boolean securityRelevantChanged = !Set.copyOf(oldPerms).equals(Set.copyOf(saved.getIncludedPermissions()))
                || oldActive != saved.isActive()
                || oldNonDelegable != saved.isNonDelegable();
        if (securityRelevantChanged) {
            invalidateHoldersCache(saved.getModuleCode());
        }

        List<AuditLog.ChangedField> changes = new ArrayList<>();
        if (!Objects.equals(oldName, saved.getName())) {
            changes.add(new AuditLog.ChangedField("name", oldName, saved.getName()));
        }
        if (oldActive != saved.isActive()) {
            changes.add(new AuditLog.ChangedField("active", oldActive, saved.isActive()));
        }
        if (oldNonDelegable != saved.isNonDelegable()) {
            changes.add(new AuditLog.ChangedField("nonDelegable", oldNonDelegable, saved.isNonDelegable()));
        }
        if (!Set.copyOf(oldPerms).equals(Set.copyOf(saved.getIncludedPermissions()))) {
            changes.add(new AuditLog.ChangedField("includedPermissions", oldPerms, saved.getIncludedPermissions()));
        }

        recordAudit(
                actor,
                oldActive != saved.isActive() && !saved.isActive() ? "RBAC_MODULE_DISABLED" : "RBAC_MODULE_UPDATED",
                saved.getModuleCode(),
                changes,
                cmd.reason() == null || cmd.reason().isBlank()
                        ? "Cập nhật gói quyền " + saved.getModuleCode()
                        : cmd.reason().trim()
        );
        return saved;
    }

    public void validateInvariants(PermissionModule module) {
        validateInvariants(module, null);
    }

    public void validateInvariants(PermissionModule module, Authentication actor) {
        if (module == null || module.getModuleCode() == null || module.getModuleCode().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Mã gói quyền không hợp lệ");
        }
        if (!MODULE_CODE_PATTERN.matcher(module.getModuleCode()).matches()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã gói quyền phải bắt đầu bằng MOD_ và chỉ gồm chữ in hoa, số, dấu gạch dưới (VD: MOD_CLUB_MEDIA)");
        }
        List<String> perms = module.getIncludedPermissions() == null ? List.of() : module.getIncludedPermissions();

        List<String> unknownPerms = perms.stream()
                .filter(p -> !AtomicPermissionCatalog.isKnown(p))
                .toList();
        if (!unknownPerms.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Chứa mã quyền không tồn tại trong danh mục hệ thống: " + String.join(", ", unknownPerms));
        }

        if (module.getModuleCode().startsWith("MOD_DEPT_")) {
            boolean containsHr = perms.stream().anyMatch(p -> p.startsWith("hr:"));
            if (containsHr) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Vi phạm nguyên tắc tách quyền (FR-RBAC-02): Không được gộp quyền nhân sự (hr:*) vào gói chuyên môn " + module.getModuleCode());
            }
        }

        if (perms.containsAll(SENSITIVE_SEPARATED_PERMS)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Vi phạm nguyên tắc tách quyền nhạy cảm: Không được gộp chung liveqa:moderate và liveqa:unmask trong cùng 1 gói");
        }

        boolean containsSensitiveNonDelegable = perms.stream()
                .map(AtomicPermissionCatalog::find)
                .anyMatch(opt -> opt.map(AtomicPermissionCatalog.PermissionDefinition::sensitiveNonDelegable).orElse(false));
        if (containsSensitiveNonDelegable && !module.isNonDelegable()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Vi phạm nguyên tắc FR-RBAC-02: Gói chứa quyền nhạy cảm (audit:view, liveqa:unmask, yitbot:approve_knowledge, yitbot:budget_config) bắt buộc phải bật Non-delegable = true");
        }

        if ("MOD_YITBOT_FULL".equals(module.getModuleCode()) && !module.isNonDelegable()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Gói MOD_YITBOT_FULL bắt buộc phải ở trạng thái nonDelegable = true");
        }

        if (actor != null) {
            boolean isBtv = hasAuthority(actor, "ROLE_STANDING_COMMITTEE");
            boolean isSysAdminOnly = hasAuthority(actor, "ROLE_SYSTEM_ADMIN") && !isBtv;
            boolean containsForbiddenForSysAdmin = perms.stream()
                    .map(AtomicPermissionCatalog::find)
                    .anyMatch(opt -> opt.map(AtomicPermissionCatalog.PermissionDefinition::forbiddenForSystemAdmin).orElse(false));
            if (isSysAdminOnly && containsForbiddenForSysAdmin) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Từ chối 403 (FR-RBAC-02): SystemAdmin không được phép tạo hoặc cấu hình gói quyền chứa liveqa:unmask");
            }
        }
    }

    private void invalidateHoldersCache(String moduleCode) {
        if (userRepository == null) {
            return;
        }
        for (User user : userRepository.findAll()) {
            if (user.getAssignedModules() == null || user.getAssignedModules().isEmpty()) {
                continue;
            }
            boolean holdsModule = user.getAssignedModules().stream()
                    .anyMatch(am -> am != null && Objects.equals(moduleCode, am.moduleCode()));
            if (holdsModule) {
                long nextVer = user.getPermissionVersion() + 1L;
                user.setPermissionVersion(nextVer);
                userRepository.save(user);
                if (effectivePermissionService != null) {
                    effectivePermissionService.evictLocalCache(user.getId());
                }
                if (rbacCacheService != null) {
                    rbacCacheService.invalidateUserPermissions(user.getId(), nextVer);
                }
            }
        }
    }

    private String normalizeModuleCode(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Mã gói quyền không được để trống");
        }
        return raw.trim().toUpperCase();
    }

    private String normalizeRequiredText(String raw, String message) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, message);
        }
        return raw.trim();
    }

    private List<String> normalizePermissions(List<String> permissions) {
        if (permissions == null) {
            return List.of();
        }
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String p : permissions) {
            if (p != null && !p.isBlank()) {
                set.add(p.trim());
            }
        }
        return List.copyOf(set);
    }

    private boolean hasAuthority(Authentication auth, String authority) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    private void recordAudit(
            Authentication actor,
            String action,
            String targetId,
            List<AuditLog.ChangedField> fields,
            String reason
    ) {
        if (auditLogService != null) {
            auditLogService.record(
                    actor != null ? actor.getName() : "SYSTEM",
                    null,
                    action,
                    "PERMISSION_MODULE",
                    targetId,
                    fields,
                    reason,
                    null,
                    null
            );
        }
    }

    public record CreateModuleCommand(
            String moduleCode,
            String name,
            String description,
            List<String> includedPermissions,
            boolean nonDelegable,
            String reason
    ) {
    }

    public record UpdateModuleCommand(
            String name,
            String description,
            List<String> includedPermissions,
            Boolean nonDelegable,
            Boolean active,
            String reason
    ) {
    }
}
