package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

/**
 * Stores WebCrypto ECDSA P-256 non-extractable publicKeyJwk for Proof-of-Possession (A2, A9).
 */
@Document(collection = "DEVICE_TOKENS")
public class DeviceToken {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed(unique = true)
    private String tokenHash;

    private Map<String, Object> publicKeyJwk;
    private String userAgent;
    private Instant createdAt = Instant.now();
    private Instant lastUsedAt = Instant.now();
    private boolean revoked = false;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public Map<String, Object> getPublicKeyJwk() { return publicKeyJwk; }
    public void setPublicKeyJwk(Map<String, Object> publicKeyJwk) { this.publicKeyJwk = publicKeyJwk; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }
    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }
}
