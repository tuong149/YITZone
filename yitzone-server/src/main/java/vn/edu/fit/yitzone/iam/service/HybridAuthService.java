package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.JwtTokenService;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.privacy.domain.ConsentRecord;
import vn.edu.fit.yitzone.privacy.repository.ConsentRecordRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core Hybrid Authentication service covering UC-IAM-01 (Register + OTP + Roster + Auto-Link),
 * UC-IAM-02 (Google Workspace OIDC + Account Linking + Pre-account Takeover defense),
 * and UC-IAM-03 (Login + Lockout + TOTP MFA + Password Reset/Change/Setup + Refresh Rotation).
 */
@Service
public class HybridAuthService {
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);
    private static final Duration MFA_CHALLENGE_TTL = Duration.ofMinutes(5);
    private static final String MFA_CHALLENGE_PREFIX = "auth:mfa:challenge:";
    private static final String DEFAULT_POLICY_VERSION = "v2026.1";

    private final UserRepository userRepository;
    private final UserAuthIdentityRepository authIdentityRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final TotpMfaService totpMfaService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenService jwtTokenService;
    private final EffectivePermissionService effectivePermissionService;
    private final IdentityResolutionService identityResolutionService;
    private final WalkInAutoLinkService walkInAutoLinkService;
    private final AuditLogService auditLogService;
    private final StringRedisTemplate redisTemplate;
    private final boolean enforceAdminMfa;

    private final Map<String, MfaChallenge> localMfaChallenges = new ConcurrentHashMap<>();

    public HybridAuthService(
            UserRepository userRepository,
            UserAuthIdentityRepository authIdentityRepository,
            ConsentRecordRepository consentRecordRepository,
            PasswordEncoder passwordEncoder,
            OtpService otpService,
            TotpMfaService totpMfaService,
            RefreshTokenService refreshTokenService,
            JwtTokenService jwtTokenService,
            EffectivePermissionService effectivePermissionService,
            IdentityResolutionService identityResolutionService,
            WalkInAutoLinkService walkInAutoLinkService,
            AuditLogService auditLogService,
            StringRedisTemplate redisTemplate
    ) {
        this(userRepository, authIdentityRepository, consentRecordRepository, passwordEncoder, otpService,
                totpMfaService, refreshTokenService, jwtTokenService, effectivePermissionService,
                identityResolutionService, walkInAutoLinkService, auditLogService, redisTemplate, false);
    }

    @Autowired
    public HybridAuthService(
            UserRepository userRepository,
            UserAuthIdentityRepository authIdentityRepository,
            ConsentRecordRepository consentRecordRepository,
            PasswordEncoder passwordEncoder,
            OtpService otpService,
            TotpMfaService totpMfaService,
            RefreshTokenService refreshTokenService,
            JwtTokenService jwtTokenService,
            EffectivePermissionService effectivePermissionService,
            IdentityResolutionService identityResolutionService,
            WalkInAutoLinkService walkInAutoLinkService,
            @Autowired(required = false) AuditLogService auditLogService,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Value("${yitzone.security.enforce-admin-mfa:false}") boolean enforceAdminMfa
    ) {
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.consentRecordRepository = consentRecordRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.totpMfaService = totpMfaService;
        this.refreshTokenService = refreshTokenService;
        this.jwtTokenService = jwtTokenService;
        this.effectivePermissionService = effectivePermissionService;
        this.identityResolutionService = identityResolutionService;
        this.walkInAutoLinkService = walkInAutoLinkService;
        this.auditLogService = auditLogService;
        this.redisTemplate = redisTemplate;
        this.enforceAdminMfa = enforceAdminMfa;
    }

    public RegisterResult registerWithEmail(String fullName, String rawEmail, String rawPassword, boolean consentAccepted) {
        if (!consentAccepted) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Bắt buộc xác nhận đồng ý Chính sách Bảo vệ Dữ liệu Cá nhân (Luật 91/2025/QH15)");
        }
        validatePasswordStrength(rawPassword);

        String email = normalizeEmail(rawEmail);
        Optional<UserAuthIdentity> existingOpt = authIdentityRepository.findByEmail(email);
        if (existingOpt.isPresent()) {
            UserAuthIdentity existing = existingOpt.get();
            if (existing.isEmailVerified()) {
                if (existing.getGoogleSub() != null && existing.getPasswordHash() == null) {
                    throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                            "Email này đã liên kết Google Workspace. Vui lòng đăng nhập bằng Google hoặc dùng chức năng Quên mật khẩu để thiết lập mật khẩu.");
                }
                throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                        "Email này đã được đăng ký và kích hoạt trong hệ thống.");
            }
        }

        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setFullName(fullName.trim());
        user = userRepository.save(user);

        UserAuthIdentity identity = existingOpt.orElseGet(UserAuthIdentity::new);
        identity.setUserId(user.getId());
        identity.setEmail(email);
        identity.setPasswordHash(passwordEncoder.encode(rawPassword));
        identity.setEmailVerified(false);
        OtpService.GeneratedOtp otp = otpService.generateOtp(UserAuthIdentity.OtpPurpose.EMAIL_REGISTER_VERIFY);
        identity.setPendingOtpHash(otp.otpHash());
        identity.setPendingOtpPurpose(otp.purpose());
        identity.setPendingOtpExpiresAt(otp.expiresAt());
        identity.setUpdatedAt(Instant.now());
        authIdentityRepository.save(identity);

        recordInitialPrivacyConsent(user.getId());
        otpService.sendOtpEmail(email, otp.rawCode(), otp.purpose(), otp.expiresAt());

        return new RegisterResult(email, "OTP_SENT", otp.expiresAt());
    }

    public AuthIssueResult verifyRegistrationOtp(String rawEmail, String otpCode) {
        String email = normalizeEmail(rawEmail);
        UserAuthIdentity identity = authIdentityRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Không tìm thấy yêu cầu đăng ký cho email này"));

        if (identity.getPendingOtpPurpose() != UserAuthIdentity.OtpPurpose.EMAIL_REGISTER_VERIFY
                || !otpService.verifyOtp(otpCode, identity.getPendingOtpHash(), identity.getPendingOtpExpiresAt())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã OTP không chính xác hoặc đã hết hạn");
        }

        Instant now = Instant.now();
        identity.setEmailVerified(true);
        identity.setEmailVerifiedAt(now);
        identity.setPendingOtpHash(null);
        identity.setPendingOtpPurpose(null);
        identity.setPendingOtpExpiresAt(null);
        identity.setUpdatedAt(now);
        authIdentityRepository.save(identity);

        User user = userRepository.findById(identity.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ người dùng"));
        identityResolutionService.applyTrustedIdentity(user, email, user.getFullName());
        user.setLastLoginAt(now);
        user = userRepository.save(user);

        walkInAutoLinkService.linkPendingAttendanceRecords(user);
        return issueSessionTokens(user, identity, "password");
    }

    public RegisterResult resendRegistrationOtp(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        UserAuthIdentity identity = authIdentityRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy yêu cầu đăng ký chưa kích hoạt cho email này"));
        if (identity.isEmailVerified()) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT, "Tài khoản này đã được kích hoạt");
        }
        OtpService.GeneratedOtp otp = otpService.generateOtp(UserAuthIdentity.OtpPurpose.EMAIL_REGISTER_VERIFY);
        identity.setPendingOtpHash(otp.otpHash());
        identity.setPendingOtpPurpose(otp.purpose());
        identity.setPendingOtpExpiresAt(otp.expiresAt());
        identity.setUpdatedAt(Instant.now());
        authIdentityRepository.save(identity);
        otpService.sendOtpEmail(email, otp.rawCode(), otp.purpose(), otp.expiresAt());
        return new RegisterResult(email, "OTP_RESENT", otp.expiresAt());
    }

    public AuthIssueResult authenticateGoogleOidc(String googleSub, String rawEmail, String fullName, boolean emailVerified) {
        if (!emailVerified || rawEmail == null || rawEmail.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Tài khoản Google Workspace chưa được xác minh email");
        }
        String email = normalizeEmail(rawEmail);
        Instant now = Instant.now();

        UserAuthIdentity identity = authIdentityRepository.findByGoogleSub(googleSub)
                .or(() -> authIdentityRepository.findByEmail(email))
                .orElse(null);

        User user;
        if (identity != null) {
            user = userRepository.findById(identity.getUserId()).orElseGet(User::new);
            // Pre-account Takeover defense (UC-IAM-02): neutralize unverified password registration
            if (!identity.isEmailVerified() && identity.getPasswordHash() != null) {
                identity.setPasswordHash(null);
                identity.setPendingOtpHash(null);
                identity.setPendingOtpPurpose(null);
                identity.setPendingOtpExpiresAt(null);
                recordAudit(
                        user.getId() != null ? user.getId() : email,
                        email,
                        "IAM_PRE_ACCOUNT_TAKEOVER_NEUTRALIZED",
                        "USER_AUTH_IDENTITY",
                        identity.getId(),
                        List.of(new AuditLog.ChangedField("unverifiedPasswordCleared", true, true)),
                        "Vô hiệu hóa mật khẩu đăng ký chưa xác thực khi chủ tài khoản Google Workspace thật đăng nhập"
                );
            }
            identity.setGoogleSub(googleSub);
            identity.setEmailVerified(true);
            if (identity.getEmailVerifiedAt() == null) {
                identity.setEmailVerifiedAt(now);
            }
            identity.setUpdatedAt(now);
        } else {
            user = userRepository.findByEmail(email).orElseGet(User::new);
            user.setEmail(email);
            user.setFullName(fullName != null ? fullName.trim() : email);
            user = userRepository.save(user);

            identity = new UserAuthIdentity();
            identity.setUserId(user.getId());
            identity.setEmail(email);
            identity.setGoogleSub(googleSub);
            identity.setEmailVerified(true);
            identity.setEmailVerifiedAt(now);
            identity.setUpdatedAt(now);
        }

        identityResolutionService.applyTrustedIdentity(user, email, fullName);
        user.setLastLoginAt(now);
        user = userRepository.save(user);
        identity.setUserId(user.getId());
        authIdentityRepository.save(identity);

        walkInAutoLinkService.linkPendingAttendanceRecords(user);
        return issueSessionTokens(user, identity, "google");
    }

    public AuthIssueResult loginWithPassword(String rawEmail, String rawPassword) {
        String email = normalizeEmail(rawEmail);
        Instant now = Instant.now();

        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByPersonalEmailAndPersonalEmailVerifiedTrue(email))
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                        "Email hoặc mật khẩu không chính xác"));

        UserAuthIdentity identity = authIdentityRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                        "Email hoặc mật khẩu không chính xác"));

        if (user.getLifecycleStatus() == User.LifecycleStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Tài khoản đã được lưu trữ hoặc ẩn danh hóa và không thể đăng nhập.");
        }

        if (identity.getLockedUntil() != null && now.isBefore(identity.getLockedUntil())) {
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS,
                    "Tài khoản đang tạm khóa 15 phút do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau.");
        }

        if (!identity.isEmailVerified()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Tài khoản chưa xác thực OTP email. Vui lòng hoàn tất bước xác thực trước khi đăng nhập.");
        }

        if (identity.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, identity.getPasswordHash())) {
            int attempts = identity.getFailedLoginAttempts() + 1;
            identity.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                identity.setLockedUntil(now.plus(LOCKOUT_DURATION));
                identity.setFailedLoginAttempts(0);
            }
            identity.setUpdatedAt(now);
            authIdentityRepository.save(identity);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS,
                        "Nhập sai mật khẩu quá 5 lần liên tiếp. Tài khoản đã bị tạm khóa trong 15 phút.");
            }
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Email hoặc mật khẩu không chính xác");
        }

        identity.setFailedLoginAttempts(0);
        identity.setLockedUntil(null);
        identity.setUpdatedAt(now);
        authIdentityRepository.save(identity);

        if (identity.isMfaTotpEnabled() && identity.getMfaTotpSecretEncrypted() != null) {
            String challengeToken = UUID.randomUUID().toString();
            storeMfaChallenge(challengeToken, user.getId(), now.plus(MFA_CHALLENGE_TTL));
            return AuthIssueResult.mfaRequired(challengeToken);
        }

        if (enforceAdminMfa && requiresMandatoryMfa(user, now)) {
            String base32Secret;
            if (identity.getMfaTotpSecretEncrypted() != null) {
                base32Secret = totpMfaService.decryptSecret(identity.getMfaTotpSecretEncrypted());
            } else {
                base32Secret = totpMfaService.generateBase32Secret();
                identity.setMfaTotpSecretEncrypted(totpMfaService.encryptSecret(base32Secret));
                identity.setUpdatedAt(now);
                authIdentityRepository.save(identity);
            }
            String challengeToken = UUID.randomUUID().toString();
            storeMfaChallenge(challengeToken, user.getId(), now.plus(MFA_CHALLENGE_TTL));
            String otpauthUri = totpMfaService.buildOtpAuthUri(user.getEmail(), base32Secret);
            return AuthIssueResult.mfaSetupRequired(challengeToken, base32Secret, otpauthUri);
        }

        user.setLastLoginAt(now);
        userRepository.save(user);
        return issueSessionTokens(user, identity, "password");
    }

    public MfaSetupResult setupTotpMfa(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ xác thực"));

        String base32Secret = totpMfaService.generateBase32Secret();
        identity.setMfaTotpSecretEncrypted(totpMfaService.encryptSecret(base32Secret));
        identity.setUpdatedAt(Instant.now());
        authIdentityRepository.save(identity);

        String otpauthUri = totpMfaService.buildOtpAuthUri(user.getEmail(), base32Secret);
        return new MfaSetupResult(base32Secret, otpauthUri);
    }

    public AuthIssueResult verifyMfaLoginChallenge(String challengeToken, String code) {
        String userId = consumeMfaChallenge(challengeToken);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Phiên xác thực 2 lớp đã hết hạn. Vui lòng đăng nhập lại.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, "Tài khoản chưa bật MFA"));

        String plainSecret = totpMfaService.decryptSecret(identity.getMfaTotpSecretEncrypted());
        if (!totpMfaService.verifyCode(plainSecret, code, Instant.now())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Mã TOTP 6 chữ số không chính xác hoặc đã hết hạn");
        }

        Instant now = Instant.now();
        if (!identity.isMfaTotpEnabled()) {
            identity.setMfaTotpEnabled(true);
            recordAudit(userId, identity.getEmail(), "IAM_MFA_ENABLED", "USER", userId,
                    List.of(new AuditLog.ChangedField("mfaTotpEnabled", false, true)),
                    "Kích hoạt bắt buộc TOTP MFA khi đăng nhập quản trị");
        }
        identity.setMfaVerifiedAt(now);
        authIdentityRepository.save(identity);
        user.setLastLoginAt(now);
        userRepository.save(user);
        return issueSessionTokens(user, identity, "password");
    }

    public void enableTotpMfa(String userId, String code) {
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ xác thực"));
        if (identity.getMfaTotpSecretEncrypted() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Bạn cần khởi tạo khóa thiết lập TOTP (/mfa/setup) trước khi xác minh");
        }
        String plainSecret = totpMfaService.decryptSecret(identity.getMfaTotpSecretEncrypted());
        if (!totpMfaService.verifyCode(plainSecret, code, Instant.now())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã xác thực 6 chữ số không đúng. Vui lòng kiểm tra đồng hồ thiết bị và thử lại.");
        }
        identity.setMfaTotpEnabled(true);
        identity.setMfaVerifiedAt(Instant.now());
        identity.setUpdatedAt(Instant.now());
        authIdentityRepository.save(identity);
        recordAudit(userId, identity.getEmail(), "IAM_MFA_ENABLED", "USER", userId,
                List.of(new AuditLog.ChangedField("mfaTotpEnabled", false, true)), "Kích hoạt xác thực 2 lớp TOTP MFA");
    }

    public void disableTotpMfa(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        if (enforceAdminMfa && requiresMandatoryMfa(user, Instant.now())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Tài khoản Ban Thường vụ / Quản trị Hệ thống bắt buộc duy trì xác thực 2 lớp TOTP MFA (NFR-AUTH-01)");
        }
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ xác thực"));
        identity.setMfaTotpEnabled(false);
        identity.setMfaTotpSecretEncrypted(null);
        identity.setUpdatedAt(Instant.now());
        authIdentityRepository.save(identity);
        recordAudit(userId, identity.getEmail(), "IAM_MFA_DISABLED", "USER", userId,
                List.of(new AuditLog.ChangedField("mfaTotpEnabled", true, false)), "Tắt xác thực 2 lớp TOTP MFA");
    }

    private boolean requiresMandatoryMfa(User user, Instant now) {
        if (user == null || user.getRoleScopes() == null) {
            return false;
        }
        return user.getRoleScopes().stream()
                .filter(rs -> rs != null && rs.isActiveAt(now))
                .anyMatch(rs -> rs.roleCode() == RoleCode.STANDING_COMMITTEE || rs.roleCode() == RoleCode.SYSTEM_ADMIN);
    }

    public void requestPasswordReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        Optional<User> userOpt = userRepository.findByEmail(email)
                .or(() -> userRepository.findByPersonalEmailAndPersonalEmailVerifiedTrue(email));
        if (userOpt.isEmpty()) {
            // Neutral response per UC-IAM-03 (prevent account enumeration)
            return;
        }
        User user = userOpt.get();
        authIdentityRepository.findByUserId(user.getId()).ifPresent(identity -> {
            OtpService.GeneratedOtp otp = otpService.generateOtp(UserAuthIdentity.OtpPurpose.PASSWORD_RESET);
            identity.setPendingOtpHash(otp.otpHash());
            identity.setPendingOtpPurpose(otp.purpose());
            identity.setPendingOtpExpiresAt(otp.expiresAt());
            identity.setUpdatedAt(Instant.now());
            authIdentityRepository.save(identity);
            otpService.sendOtpEmail(email, otp.rawCode(), otp.purpose(), otp.expiresAt());
        });
    }

    public void completePasswordReset(String rawEmail, String otpCode, String newPassword) {
        validatePasswordStrength(newPassword);
        String email = normalizeEmail(rawEmail);
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByPersonalEmailAndPersonalEmailVerifiedTrue(email))
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));

        UserAuthIdentity identity = authIdentityRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));

        if (identity.getPendingOtpPurpose() != UserAuthIdentity.OtpPurpose.PASSWORD_RESET
                || !otpService.verifyOtp(otpCode, identity.getPendingOtpHash(), identity.getPendingOtpExpiresAt())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
        }

        applyNewPasswordAndRevokeSessions(user, identity, newPassword, "Đặt lại mật khẩu qua OTP");
    }

    public void changeOrSetupPassword(String userId, String currentPassword, String newPassword) {
        validatePasswordStrength(newPassword);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        UserAuthIdentity identity = authIdentityRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ xác thực"));

        if (identity.getPasswordHash() != null) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, identity.getPasswordHash())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Mật khẩu hiện tại không chính xác");
            }
        }
        applyNewPasswordAndRevokeSessions(user, identity, newPassword,
                identity.getPasswordHash() == null ? "Thiết lập mật khẩu đăng nhập" : "Đổi mật khẩu đăng nhập");
    }

    public AuthIssueResult refreshSession(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Thiếu phiên Refresh Token hợp lệ");
        }
        RefreshTokenService.RotatedSession rotated = refreshTokenService.rotateRefreshToken(
                rawRefreshToken,
                uid -> authIdentityRepository.findByUserId(uid)
                        .map(UserAuthIdentity::getRefreshTokenVersion)
                        .orElse(Long.MAX_VALUE)
        );
        User user = userRepository.findById(rotated.userId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                        "Tài khoản không còn tồn tại"));
        if (user.getLifecycleStatus() == User.LifecycleStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Tài khoản đã bị lưu trữ hoặc ẩn danh hóa");
        }
        UserAuthIdentity identity = authIdentityRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                        "Hồ sơ xác thực không tồn tại"));
        if (identity.getLockedUntil() != null && Instant.now().isBefore(identity.getLockedUntil())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Tài khoản đang bị khóa, không thể làm mới phiên");
        }

        EffectivePermissionService.ComputedPermissions perms = effectivePermissionService.resolveForUser(user);
        String accessToken = jwtTokenService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getPermissionVersion(),
                perms.authorities(),
                List.copyOf(perms.allowedScopes())
        );

        String provider = identity.getGoogleSub() != null && identity.getPasswordHash() == null ? "google" : "password";
        return AuthIssueResult.authenticated(
                new AuthSessionPayload(
                        false,
                        false,
                        null,
                        null,
                        null,
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getStudentCode(),
                        provider,
                        accessToken,
                        "Bearer",
                        perms.authorities(),
                        perms.roleScopes()
                ),
                rotated.nextToken()
        );
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeSingleToken(rawRefreshToken);
    }

    private void applyNewPasswordAndRevokeSessions(User user, UserAuthIdentity identity, String newPassword, String reason) {
        Instant now = Instant.now();
        long nextRtVersion = identity.getRefreshTokenVersion() + 1L;
        identity.setPasswordHash(passwordEncoder.encode(newPassword));
        identity.setPasswordUpdatedAt(now);
        identity.setPendingOtpHash(null);
        identity.setPendingOtpPurpose(null);
        identity.setPendingOtpExpiresAt(null);
        identity.setFailedLoginAttempts(0);
        identity.setLockedUntil(null);
        identity.setRefreshTokenVersion(nextRtVersion);
        identity.setUpdatedAt(now);
        authIdentityRepository.save(identity);

        refreshTokenService.revokeAllUserTokens(user.getId(), nextRtVersion);
        otpService.sendSecurityAlertEmail(
                user.getEmail(),
                "[YITZone] Cảnh báo bảo mật: Mật khẩu của bạn vừa được thay đổi",
                "Mật khẩu tài khoản YITZone (" + user.getEmail() + ") vừa được cập nhật lúc " + now
                        + ". Toàn bộ các phiên đăng nhập trước đó đã tự động bị thu hồi."
        );
        recordAudit(user.getId(), user.getEmail(), "IAM_PASSWORD_UPDATED", "USER", user.getId(),
                List.of(new AuditLog.ChangedField("refreshTokenVersion", nextRtVersion - 1, nextRtVersion)), reason);
    }

    private AuthIssueResult issueSessionTokens(User user, UserAuthIdentity identity, String authProvider) {
        EffectivePermissionService.ComputedPermissions perms = effectivePermissionService.resolveForUser(user);
        String accessToken = jwtTokenService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getPermissionVersion(),
                perms.authorities(),
                List.copyOf(perms.allowedScopes())
        );
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issueRefreshToken(
                user.getId(),
                identity.getRefreshTokenVersion(),
                perms.privilegedAdmin()
        );
        return AuthIssueResult.authenticated(
                new AuthSessionPayload(
                        false,
                        false,
                        null,
                        null,
                        null,
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getStudentCode(),
                        authProvider,
                        accessToken,
                        "Bearer",
                        perms.authorities(),
                        perms.roleScopes()
                ),
                refreshToken
        );
    }

    private void recordInitialPrivacyConsent(String userId) {
        if (consentRecordRepository == null) {
            return;
        }
        boolean exists = consentRecordRepository
                .findByUserIdAndConsentTypeAndPolicyVersion(userId, ConsentRecord.ConsentType.INITIAL_PRIVACY, DEFAULT_POLICY_VERSION)
                .isPresent();
        if (!exists) {
            ConsentRecord record = new ConsentRecord();
            record.setUserId(userId);
            record.setConsentType(ConsentRecord.ConsentType.INITIAL_PRIVACY);
            record.setPolicyVersion(DEFAULT_POLICY_VERSION);
            record.setGranted(true);
            record.setGrantedAt(Instant.now());
            consentRecordRepository.save(record);
        }
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*[0-9].*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mật khẩu phải có tối thiểu 8 ký tự gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt");
        }
    }

    private void storeMfaChallenge(String token, String userId, Instant expiresAt) {
        localMfaChallenges.put(token, new MfaChallenge(userId, expiresAt));
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(MFA_CHALLENGE_PREFIX + token, userId, MFA_CHALLENGE_TTL);
            } catch (Exception ignored) {
                // Fallback to local map
            }
        }
    }

    private String consumeMfaChallenge(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        if (redisTemplate != null) {
            try {
                String uid = redisTemplate.opsForValue().getAndDelete(MFA_CHALLENGE_PREFIX + token);
                if (uid != null) {
                    localMfaChallenges.remove(token);
                    return uid;
                }
            } catch (Exception ignored) {
                // Fallback to local map
            }
        }
        MfaChallenge local = localMfaChallenges.remove(token);
        if (local == null || Instant.now().isAfter(local.expiresAt())) {
            return null;
        }
        return local.userId();
    }

    private void recordAudit(
            String actorId,
            String actorEmail,
            String action,
            String targetType,
            String targetId,
            List<AuditLog.ChangedField> fields,
            String reason
    ) {
        if (auditLogService != null) {
            auditLogService.record(actorId, actorEmail, action, targetType, targetId, fields, reason, null, null);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private record MfaChallenge(String userId, Instant expiresAt) {
    }

    public record RegisterResult(String email, String status, Instant otpExpiresAt) {
    }

    public record MfaSetupResult(String secret, String otpauthUri) {
    }

    public record AuthSessionPayload(
            boolean mfaRequired,
            boolean mfaSetupRequired,
            String mfaChallengeToken,
            String mfaSecret,
            String mfaOtpAuthUri,
            String userId,
            String email,
            String fullName,
            String studentCode,
            String authProvider,
            String accessToken,
            String tokenType,
            List<String> authorities,
            List<EffectivePermissionService.RoleScopeView> roleScopes
    ) {
    }

    public record AuthIssueResult(
            AuthSessionPayload payload,
            RefreshTokenService.IssuedRefreshToken refreshToken
    ) {
        public static AuthIssueResult mfaRequired(String challengeToken) {
            return new AuthIssueResult(
                    new AuthSessionPayload(true, false, challengeToken, null, null, null, null, null, null, "password", null, null, List.of(), List.of()),
                    null
            );
        }

        public static AuthIssueResult mfaSetupRequired(String challengeToken, String secret, String otpAuthUri) {
            return new AuthIssueResult(
                    new AuthSessionPayload(true, true, challengeToken, secret, otpAuthUri, null, null, null, null, "password", null, null, List.of(), List.of()),
                    null
            );
        }

        public static AuthIssueResult authenticated(AuthSessionPayload payload, RefreshTokenService.IssuedRefreshToken refreshToken) {
            return new AuthIssueResult(payload, refreshToken);
        }
    }
}
