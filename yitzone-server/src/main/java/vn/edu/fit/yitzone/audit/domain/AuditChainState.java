package vn.edu.fit.yitzone.audit.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Singleton state document (id = "MAIN_CHAIN") for atomic seq & prevHash allocation and daily off-site anchoring (UC-SYS-02, A20).
 */
@Document(collection = "AUDIT_CHAIN_STATE")
public class AuditChainState {
    public static final String MAIN_CHAIN_ID = "MAIN_CHAIN";

    @Id
    private String id = MAIN_CHAIN_ID;

    private long lastSeq = 0L;
    private String lastHash = "GENESIS";
    private long lastAnchoredSeq = 0L;
    private String lastAnchoredHash;
    private Instant lastAnchoredAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public long getLastSeq() { return lastSeq; }
    public void setLastSeq(long lastSeq) { this.lastSeq = lastSeq; }
    public String getLastHash() { return lastHash; }
    public void setLastHash(String lastHash) { this.lastHash = lastHash; }
    public long getLastAnchoredSeq() { return lastAnchoredSeq; }
    public void setLastAnchoredSeq(long lastAnchoredSeq) { this.lastAnchoredSeq = lastAnchoredSeq; }
    public String getLastAnchoredHash() { return lastAnchoredHash; }
    public void setLastAnchoredHash(String lastAnchoredHash) { this.lastAnchoredHash = lastAnchoredHash; }
    public Instant getLastAnchoredAt() { return lastAnchoredAt; }
    public void setLastAnchoredAt(Instant lastAnchoredAt) { this.lastAnchoredAt = lastAnchoredAt; }
}
