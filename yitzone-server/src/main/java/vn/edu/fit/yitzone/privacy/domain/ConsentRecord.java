package vn.edu.fit.yitzone.privacy.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Personal Data Protection opt-in consent audit trail (UC-IAM-11, NFR-PRIV-01).
 */
@Document(collection = "CONSENT_RECORDS")
@CompoundIndex(name = "idx_consent_user_type_version", def = "{'userId': 1, 'consentType': 1, 'policyVersion': 1}")
public class ConsentRecord {
    @Id
    private String id;

    private String userId;
    private ConsentType consentType;
    private String policyVersion;
    private boolean granted;
    private Instant grantedAt;
    private Instant revokedAt;

    public enum ConsentType {
        INITIAL_PRIVACY,
        PORTRAIT_TICKET,
        AI_USAGE,
        LOCATION_CHECKIN
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public ConsentType getConsentType() { return consentType; }
    public void setConsentType(ConsentType consentType) { this.consentType = consentType; }
    public String getPolicyVersion() { return policyVersion; }
    public void setPolicyVersion(String policyVersion) { this.policyVersion = policyVersion; }
    public boolean isGranted() { return granted; }
    public void setGranted(boolean granted) { this.granted = granted; }
    public Instant getGrantedAt() { return grantedAt; }
    public void setGrantedAt(Instant grantedAt) { this.grantedAt = grantedAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}
