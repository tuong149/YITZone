package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Stores authentication credentials & OIDC account linking per User (UC-IAM-01, UC-IAM-02, UC-IAM-03).
 * Supports Google Workspace OIDC (googleSub), Email + Password (Argon2id/BCrypt), OTP verification,
 * TOTP MFA for BTV/SystemAdmin, and brute-force lockout protection.
 */
@Document(collection = "USER_AUTH_IDENTITIES")
public class UserAuthIdentity {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Indexed(unique = true, sparse = true)
    private String googleSub;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;
    private boolean emailVerified = false;
    private Instant emailVerifiedAt;
    private String pendingOtpHash;
    private OtpPurpose pendingOtpPurpose;
    private Instant pendingOtpExpiresAt;

    private boolean mfaTotpEnabled = false;
    private String mfaTotpSecretEncrypted;
    private Instant mfaVerifiedAt;

    private int failedLoginAttempts = 0;
    private Instant lockedUntil;
    private long refreshTokenVersion = 1L;
    private Instant passwordUpdatedAt;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public enum OtpPurpose {
        EMAIL_REGISTER_VERIFY,
        PASSWORD_RESET,
        PERSONAL_EMAIL_LINK,
        PASSWORD_SETUP
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getGoogleSub() { return googleSub; }
    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public Instant getEmailVerifiedAt() { return emailVerifiedAt; }
    public void setEmailVerifiedAt(Instant emailVerifiedAt) { this.emailVerifiedAt = emailVerifiedAt; }
    public String getPendingOtpHash() { return pendingOtpHash; }
    public void setPendingOtpHash(String pendingOtpHash) { this.pendingOtpHash = pendingOtpHash; }
    public OtpPurpose getPendingOtpPurpose() { return pendingOtpPurpose; }
    public void setPendingOtpPurpose(OtpPurpose pendingOtpPurpose) { this.pendingOtpPurpose = pendingOtpPurpose; }
    public Instant getPendingOtpExpiresAt() { return pendingOtpExpiresAt; }
    public void setPendingOtpExpiresAt(Instant pendingOtpExpiresAt) { this.pendingOtpExpiresAt = pendingOtpExpiresAt; }
    public boolean isMfaTotpEnabled() { return mfaTotpEnabled; }
    public void setMfaTotpEnabled(boolean mfaTotpEnabled) { this.mfaTotpEnabled = mfaTotpEnabled; }
    public String getMfaTotpSecretEncrypted() { return mfaTotpSecretEncrypted; }
    public void setMfaTotpSecretEncrypted(String mfaTotpSecretEncrypted) { this.mfaTotpSecretEncrypted = mfaTotpSecretEncrypted; }
    public Instant getMfaVerifiedAt() { return mfaVerifiedAt; }
    public void setMfaVerifiedAt(Instant mfaVerifiedAt) { this.mfaVerifiedAt = mfaVerifiedAt; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
    public Instant getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Instant lockedUntil) { this.lockedUntil = lockedUntil; }
    public long getRefreshTokenVersion() { return refreshTokenVersion; }
    public void setRefreshTokenVersion(long refreshTokenVersion) { this.refreshTokenVersion = refreshTokenVersion; }
    public Instant getPasswordUpdatedAt() { return passwordUpdatedAt; }
    public void setPasswordUpdatedAt(Instant passwordUpdatedAt) { this.passwordUpdatedAt = passwordUpdatedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
