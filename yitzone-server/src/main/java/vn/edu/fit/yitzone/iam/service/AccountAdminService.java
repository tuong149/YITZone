package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Administrative user account management (listing, provisioning, lock/unlock, lifecycle status, password reset).
 */
@Service
public class AccountAdminService {
    private static final Duration ADMIN_LOCK_DURATION = Duration.ofDays(3650);

    private final UserRepository userRepository;
    private final UserAuthIdentityRepository authIdentityRepository;
    private final PasswordEncoder passwordEncoder;
    private final RbacCacheInvalidationService rbacCacheService;
    private final EffectivePermissionService effectivePermissionService;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;

    @Autowired
    public AccountAdminService(
            UserRepository userRepository,
            UserAuthIdentityRepository authIdentityRepository,
            PasswordEncoder passwordEncoder,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) RefreshTokenService refreshTokenService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.passwordEncoder = passwordEncoder;
        this.rbacCacheService = rbacCacheService;
        this.effectivePermissionService = effectivePermissionService;
        this.refreshTokenService = refreshTokenService;
        this.auditLogService = auditLogService;
    }

    public List<AccountSummary> listAccounts(String search, String userType, String status) {
        List<User> users = userRepository.findAll();
        Map<String, UserAuthIdentity> identityByUserId = new HashMap<>();
        for (UserAuthIdentity identity : authIdentityRepository.findAll()) {
            if (identity.getUserId() != null) {
                identityByUserId.put(identity.getUserId(), identity);
            }
        }

        Instant now = Instant.now();
        String q = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String typeFilter = userType == null ? "" : userType.trim().toUpperCase(Locale.ROOT);
        String statusFilter = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);

        return users.stream()
                .map(u -> toSummary(u, identityByUserId.get(u.getId()), now))
                .filter(s -> {
                    if (!q.isEmpty()) {
                        boolean match = contains(s.fullName(), q)
                                || contains(s.email(), q)
                                || contains(s.studentCode(), q)
                                || contains(s.staffId(), q);
                        if (!match) return false;
                    }
                    if (!typeFilter.isEmpty() && !"ALL".equals(typeFilter)) {
                        if (s.userType() == null || !typeFilter.equals(s.userType().name())) {
                            return false;
                        }
                    }
                    if (!statusFilter.isEmpty() && !"ALL".equals(statusFilter)) {
                        if ("LOCKED".equals(statusFilter)) {
                            return s.locked();
                        }
                        if (s.lifecycleStatus() == null || !statusFilter.equals(s.lifecycleStatus().name())) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted(Comparator.comparing(
                        AccountSummary::fullName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ))
                .toList();
    }

    public AccountSummary createAccount(CreateAccountRequest request, Authentication actor) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(normalizedEmail).isPresent()
                || authIdentityRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Email '" + normalizedEmail + "' đã tồn tại trong hệ thống");
        }

        String studentCode = request.studentCode() == null || request.studentCode().isBlank()
                ? null
                : request.studentCode().trim();
        if (studentCode != null && userRepository.findByStudentCode(studentCode).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "MSSV '" + studentCode + "' đã được gắn cho tài khoản khác");
        }

        if (request.initialPassword() != null && !request.initialPassword().isBlank()
                && request.initialPassword().length() < 8) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mật khẩu ban đầu phải có tối thiểu 8 ký tự");
        }

        Instant now = Instant.now();
        User user = new User();
        user.setId("usr-" + UUID.randomUUID().toString().substring(0, 12));
        user.setEmail(normalizedEmail);
        user.setFullName(request.fullName().trim());
        user.setStudentCode(studentCode);
        user.setUserType(request.userType() == null ? User.UserType.STUDENT : request.userType());
        user.setLifecycleStatus(User.LifecycleStatus.ACTIVE_STUDY);
        user.setPermissionVersion(1L);

        if (request.roleCode() != null) {
            String scopeId = request.scopeId() == null || request.scopeId().isBlank()
                    ? "FACULTY"
                    : request.scopeId().trim();
            String scopeType = "FACULTY".equalsIgnoreCase(scopeId) ? "FACULTY" : "COMMITTEE";
            List<User.RoleScope> scopes = new ArrayList<>();
            scopes.add(new User.RoleScope(
                    request.roleCode(),
                    null,
                    "FACULTY".equalsIgnoreCase(scopeId) ? "FIT" : scopeId,
                    scopeType,
                    scopeId,
                    "2025-2026",
                    now,
                    null,
                    null
            ));
            user.setRoleScopes(scopes);
        }

        User savedUser = userRepository.save(user);

        UserAuthIdentity identity = new UserAuthIdentity();
        identity.setUserId(savedUser.getId());
        identity.setEmail(normalizedEmail);
        identity.setEmailVerified(true);
        identity.setEmailVerifiedAt(now);
        identity.setCreatedAt(now);
        identity.setUpdatedAt(now);
        if (request.initialPassword() != null && !request.initialPassword().isBlank()) {
            identity.setPasswordHash(passwordEncoder.encode(request.initialPassword()));
            identity.setPasswordUpdatedAt(now);
        }
        UserAuthIdentity savedIdentity = authIdentityRepository.save(identity);

        recordAudit(
                actor != null ? actor.getName() : "system",
                "IAM_ACCOUNT_CREATED",
                savedUser.getId(),
                List.of(
                        new AuditLog.ChangedField("email", null, normalizedEmail),
                        new AuditLog.ChangedField("userType", null, savedUser.getUserType().name())
                ),
                "Tạo tài khoản mới từ cổng quản trị"
        );

        return toSummary(savedUser, savedIdentity, now);
    }

    public AccountSummary updateAccountStatus(String userId, UpdateStatusRequest request, Authentication actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản: " + userId));

        if (actor != null && userId.equals(actor.getName())) {
            boolean selfLock = Boolean.TRUE.equals(request.locked());
            boolean selfArchive = request.lifecycleStatus() == User.LifecycleStatus.ARCHIVED;
            if (selfLock || selfArchive) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Không thể tự khóa hoặc lưu trữ tài khoản đang đăng nhập");
            }
        }

        Instant now = Instant.now();
        List<AuditLog.ChangedField> changes = new ArrayList<>();

        if (request.lifecycleStatus() != null && request.lifecycleStatus() != user.getLifecycleStatus()) {
            changes.add(new AuditLog.ChangedField(
                    "lifecycleStatus",
                    user.getLifecycleStatus() != null ? user.getLifecycleStatus().name() : null,
                    request.lifecycleStatus().name()
            ));
            user.setLifecycleStatus(request.lifecycleStatus());
        }

        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId).orElseGet(() -> {
            UserAuthIdentity created = new UserAuthIdentity();
            created.setUserId(userId);
            created.setEmail(user.getEmail());
            created.setEmailVerified(true);
            created.setCreatedAt(now);
            return created;
        });

        boolean invalidateSession = false;
        if (request.locked() != null) {
            boolean wasLocked = identity.getLockedUntil() != null && identity.getLockedUntil().isAfter(now);
            if (request.locked()) {
                identity.setLockedUntil(now.plus(ADMIN_LOCK_DURATION));
                identity.setRefreshTokenVersion(identity.getRefreshTokenVersion() + 1L);
                user.setPermissionVersion(user.getPermissionVersion() + 1L);
                invalidateSession = true;
            } else {
                identity.setLockedUntil(null);
                identity.setFailedLoginAttempts(0);
            }
            if (wasLocked != request.locked()) {
                changes.add(new AuditLog.ChangedField("locked", String.valueOf(wasLocked), String.valueOf(request.locked())));
            }
        }

        identity.setUpdatedAt(now);
        User savedUser = userRepository.save(user);
        UserAuthIdentity savedIdentity = authIdentityRepository.save(identity);

        if (invalidateSession) {
            if (effectivePermissionService != null) {
                effectivePermissionService.evictLocalCache(savedUser.getId());
            }
            if (rbacCacheService != null) {
                rbacCacheService.invalidateUserPermissions(savedUser.getId(), savedUser.getPermissionVersion());
            }
            if (refreshTokenService != null) {
                refreshTokenService.revokeAllUserTokens(savedUser.getId(), savedIdentity.getRefreshTokenVersion());
            }
        }

        String actionCode = Boolean.TRUE.equals(request.locked())
                ? "IAM_ACCOUNT_LOCKED"
                : Boolean.FALSE.equals(request.locked())
                ? "IAM_ACCOUNT_UNLOCKED"
                : "IAM_ACCOUNT_STATUS_UPDATED";
        recordAudit(
                actor != null ? actor.getName() : "system",
                actionCode,
                savedUser.getId(),
                changes,
                request.reason() != null && !request.reason().isBlank() ? request.reason().trim() : "Cập nhật trạng thái tài khoản"
        );

        return toSummary(savedUser, savedIdentity, now);
    }

    public void resetPassword(String userId, ResetPasswordRequest request, Authentication actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản: " + userId));

        if (request.newPassword() == null || request.newPassword().length() < 8) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mật khẩu mới phải có tối thiểu 8 ký tự");
        }

        Instant now = Instant.now();
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId).orElseGet(() -> {
            UserAuthIdentity created = new UserAuthIdentity();
            created.setUserId(userId);
            created.setEmail(user.getEmail());
            created.setEmailVerified(true);
            created.setEmailVerifiedAt(now);
            created.setCreatedAt(now);
            return created;
        });

        identity.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        identity.setPasswordUpdatedAt(now);
        identity.setFailedLoginAttempts(0);
        identity.setLockedUntil(null);
        identity.setRefreshTokenVersion(identity.getRefreshTokenVersion() + 1L);
        identity.setUpdatedAt(now);
        UserAuthIdentity savedIdentity = authIdentityRepository.save(identity);
        if (refreshTokenService != null) {
            refreshTokenService.revokeAllUserTokens(user.getId(), savedIdentity.getRefreshTokenVersion());
        }

        recordAudit(
                actor != null ? actor.getName() : "system",
                "IAM_ACCOUNT_PASSWORD_RESET",
                user.getId(),
                List.of(new AuditLog.ChangedField("passwordReset", "false", "true")),
                request.reason() != null && !request.reason().isBlank() ? request.reason().trim() : "Quản trị viên đặt lại mật khẩu"
        );
    }

    private AccountSummary toSummary(User user, UserAuthIdentity identity, Instant now) {
        boolean locked = identity != null && identity.getLockedUntil() != null && identity.getLockedUntil().isAfter(now);
        List<String> activeRoles = user.getRoleScopes() == null
                ? List.of()
                : user.getRoleScopes().stream()
                .filter(rs -> rs.isActiveAt(now) && rs.roleCode() != null)
                .map(rs -> rs.roleCode().name())
                .distinct()
                .toList();
        int activeModules = user.getAssignedModules() == null
                ? 0
                : (int) user.getAssignedModules().stream()
                .filter(m -> m.expiresAt() == null || now.isBefore(m.expiresAt()))
                .count();

        return new AccountSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getStudentCode(),
                user.getStaffId(),
                user.getUserType(),
                user.getLifecycleStatus(),
                user.getMajorCode(),
                user.getClassName(),
                identity != null && identity.isEmailVerified(),
                identity != null && identity.getPasswordHash() != null,
                identity != null && identity.getGoogleSub() != null && !identity.getGoogleSub().isBlank(),
                identity != null && identity.isMfaTotpEnabled(),
                locked,
                identity != null ? identity.getLockedUntil() : null,
                user.getLastLoginAt(),
                activeRoles,
                activeModules,
                identity != null ? identity.getCreatedAt() : null
        );
    }

    private boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private void recordAudit(String actorId, String actionCode, String targetId, List<AuditLog.ChangedField> changes, String reason) {
        if (auditLogService == null) {
            return;
        }
        auditLogService.record(actorId, null, actionCode, "USER", targetId, changes, reason, null, null);
    }

    public record AccountSummary(
            String id,
            String fullName,
            String email,
            String studentCode,
            String staffId,
            User.UserType userType,
            User.LifecycleStatus lifecycleStatus,
            String majorCode,
            String className,
            boolean emailVerified,
            boolean hasPassword,
            boolean googleLinked,
            boolean mfaTotpEnabled,
            boolean locked,
            Instant lockedUntil,
            Instant lastLoginAt,
            List<String> roles,
            int assignedModuleCount,
            Instant createdAt
    ) {
    }

    public record CreateAccountRequest(
            String fullName,
            String email,
            String studentCode,
            User.UserType userType,
            RoleCode roleCode,
            String scopeId,
            String initialPassword
    ) {
    }

    public record UpdateStatusRequest(
            User.LifecycleStatus lifecycleStatus,
            Boolean locked,
            String reason
    ) {
    }

    public record ResetPasswordRequest(
            String newPassword,
            String reason
    ) {
    }
}
