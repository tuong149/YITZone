package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Manages personal Union/Association profile, backup personal email OTP linking,
 * and post-graduation account lifecycle transitions (UC-IAM-05, FR-IAM-02).
 */
@Service
public class UserLifecycleProfileService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final UserAuthIdentityRepository authIdentityRepository;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final EffectivePermissionService effectivePermissionService;
    private final AuditLogService auditLogService;

    public UserLifecycleProfileService(
            UserRepository userRepository,
            UserAuthIdentityRepository authIdentityRepository,
            OtpService otpService,
            @Autowired(required = false) RefreshTokenService refreshTokenService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
        this.rbacCacheService = rbacCacheService;
        this.effectivePermissionService = effectivePermissionService;
        this.auditLogService = auditLogService;
    }

    public User updateMyProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy hồ sơ người dùng"));

        if (request.className() != null) {
            user.setClassName(request.className().trim());
        }
        if (request.cohort() != null) {
            user.setCohort(request.cohort());
        }
        User.UnionMemberProfile existing = user.getUnionMemberProfile();
        String youthUnionBranch = request.youthUnionBranch() != null
                ? request.youthUnionBranch().trim()
                : (existing != null ? existing.youthUnionBranch() : null);
        String studentAssociationBranch = request.studentAssociationBranch() != null
                ? request.studentAssociationBranch().trim()
                : (existing != null ? existing.studentAssociationBranch() : null);
        LocalDate youthUnionJoinDate = request.youthUnionJoinDate() != null
                ? request.youthUnionJoinDate()
                : (existing != null ? existing.youthUnionJoinDate() : null);
        LocalDate studentAssociationJoinDate = request.studentAssociationJoinDate() != null
                ? request.studentAssociationJoinDate()
                : (existing != null ? existing.studentAssociationJoinDate() : null);

        user.setUnionMemberProfile(new User.UnionMemberProfile(
                youthUnionBranch,
                studentAssociationBranch,
                youthUnionJoinDate,
                studentAssociationJoinDate
        ));

        return userRepository.save(user);
    }

    public PersonalEmailOtpResult requestPersonalEmailLink(String userId, String rawPersonalEmail) {
        String personalEmail = normalizeEmail(rawPersonalEmail);
        if (!EMAIL_PATTERN.matcher(personalEmail).matches()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Địa chỉ email cá nhân không đúng định dạng");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy hồ sơ người dùng"));

        if (personalEmail.equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Email cá nhân dự phòng phải khác Email chính của tài khoản");
        }

        Optional<User> conflict = userRepository.findByPersonalEmailAndPersonalEmailVerifiedTrue(personalEmail);
        if (conflict.isPresent() && !conflict.get().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Email cá nhân này đã được liên kết với một tài khoản khác");
        }
        Optional<User> primaryConflict = userRepository.findByEmail(personalEmail);
        if (primaryConflict.isPresent() && !primaryConflict.get().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Email cá nhân này đã được sử dụng làm email chính của một tài khoản khác");
        }

        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserAuthIdentity created = new UserAuthIdentity();
                    created.setUserId(userId);
                    created.setEmail(user.getEmail());
                    created.setEmailVerified(true);
                    return created;
                });

        OtpService.GeneratedOtp otp = otpService.generateOtp(UserAuthIdentity.OtpPurpose.PERSONAL_EMAIL_LINK);
        identity.setPendingOtpHash(otp.otpHash());
        identity.setPendingOtpPurpose(otp.purpose());
        identity.setPendingOtpExpiresAt(otp.expiresAt());
        identity.setUpdatedAt(Instant.now());
        authIdentityRepository.save(identity);

        user.setPersonalEmail(personalEmail);
        user.setPersonalEmailVerified(false);
        user.setPersonalEmailVerifiedAt(null);
        userRepository.save(user);

        otpService.sendOtpEmail(personalEmail, otp.rawCode(), otp.purpose(), otp.expiresAt());
        return new PersonalEmailOtpResult(personalEmail, "OTP_SENT", otp.expiresAt());
    }

    public PersonalEmailVerifiedResult verifyPersonalEmailOtp(String userId, String otpCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy hồ sơ người dùng"));
        if (user.getPersonalEmail() == null || user.getPersonalEmail().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Bạn chưa gửi yêu cầu liên kết email cá nhân");
        }
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Không tìm thấy hồ sơ xác thực"));

        if (identity.getPendingOtpPurpose() != UserAuthIdentity.OtpPurpose.PERSONAL_EMAIL_LINK
                || !otpService.verifyOtp(otpCode, identity.getPendingOtpHash(), identity.getPendingOtpExpiresAt())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã OTP xác thực email cá nhân không đúng hoặc đã hết hạn");
        }

        Instant now = Instant.now();
        identity.setPendingOtpHash(null);
        identity.setPendingOtpPurpose(null);
        identity.setPendingOtpExpiresAt(null);
        identity.setUpdatedAt(now);
        authIdentityRepository.save(identity);

        user.setPersonalEmailVerified(true);
        user.setPersonalEmailVerifiedAt(now);
        userRepository.save(user);

        recordAudit(userId, "IAM_PERSONAL_EMAIL_VERIFIED", userId,
                List.of(new AuditLog.ChangedField("personalEmail", null, user.getPersonalEmail())),
                "Liên kết và xác thực OTP email cá nhân dự phòng sau tốt nghiệp");

        return new PersonalEmailVerifiedResult(user.getPersonalEmail(), true, now);
    }

    public User updateLifecycleStatus(
            String targetUserId,
            User.LifecycleStatus nextStatus,
            String reason,
            String actorId
    ) {
        if (nextStatus == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Trạng thái vòng đời mới không được để trống");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng: " + targetUserId));

        User.LifecycleStatus oldStatus = user.getLifecycleStatus();
        Instant now = Instant.now();
        user.setLifecycleStatus(nextStatus);

        boolean revokePrivileges = false;
        if (nextStatus == User.LifecycleStatus.ARCHIVED) {
            List<User.RoleScope> closedScopes = new ArrayList<>();
            List<User.TermHistory> history = new ArrayList<>(user.getTermHistory() == null ? List.of() : user.getTermHistory());
            if (user.getRoleScopes() != null) {
                for (User.RoleScope rs : user.getRoleScopes()) {
                    if (rs.isActiveAt(now)) {
                        closedScopes.add(new User.RoleScope(
                                rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                                rs.termYear(), rs.startAt(), now, rs.expiresAt()
                        ));
                        history.add(new User.TermHistory(
                                rs.termYear(),
                                rs.unitId() != null ? rs.unitId() : rs.scopeId(),
                                rs.positionTitle() != null ? rs.positionTitle().getDisplayName() : String.valueOf(rs.roleCode()),
                                rs.startAt(),
                                now
                        ));
                    } else {
                        closedScopes.add(rs);
                    }
                }
            }
            user.setRoleScopes(closedScopes);
            user.setAssignedModules(new ArrayList<>());
            user.setTermHistory(history);
            user.setPermissionVersion(user.getPermissionVersion() + 1L);
            revokePrivileges = true;
        }

        User saved = userRepository.save(user);

        if (revokePrivileges) {
            authIdentityRepository.findByUserId(targetUserId).ifPresent(identity -> {
                long nextRtVer = identity.getRefreshTokenVersion() + 1L;
                identity.setRefreshTokenVersion(nextRtVer);
                identity.setUpdatedAt(now);
                authIdentityRepository.save(identity);
                if (refreshTokenService != null) {
                    refreshTokenService.revokeAllUserTokens(targetUserId, nextRtVer);
                }
            });
            if (effectivePermissionService != null) {
                effectivePermissionService.evictLocalCache(targetUserId);
            }
            if (rbacCacheService != null) {
                rbacCacheService.invalidateUserPermissions(targetUserId, saved.getPermissionVersion());
            }
        }

        recordAudit(actorId, "IAM_LIFECYCLE_UPDATED", targetUserId,
                List.of(new AuditLog.ChangedField("lifecycleStatus", oldStatus != null ? oldStatus.name() : null, nextStatus.name())),
                reason == null || reason.isBlank() ? "Chuyển trạng thái vòng đời tài khoản sang " + nextStatus.name() : reason);
        return saved;
    }

    private void recordAudit(String actorId, String action, String targetId, List<AuditLog.ChangedField> fields, String reason) {
        if (auditLogService != null) {
            auditLogService.record(actorId, null, action, "USER", targetId, fields, reason, null, null);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public record UpdateProfileRequest(
            String className,
            Integer cohort,
            String youthUnionBranch,
            String studentAssociationBranch,
            LocalDate youthUnionJoinDate,
            LocalDate studentAssociationJoinDate
    ) {
    }

    public record PersonalEmailOtpResult(String personalEmail, String status, Instant otpExpiresAt) {
    }

    public record PersonalEmailVerifiedResult(String personalEmail, boolean verified, Instant verifiedAt) {
    }
}

