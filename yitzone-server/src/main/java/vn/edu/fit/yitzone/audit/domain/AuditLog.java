package vn.edu.fit.yitzone.audit.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Tamper-evident hash-chained audit log entry (HLD 5.2, A20, UC-SYS-02).
 */
@Document(collection = "AUDIT_LOGS")
@CompoundIndex(name = "idx_audit_created_target", def = "{'createdAt': -1, 'targetType': 1}")
public class AuditLog {
    @Id
    private String id;

    @Indexed(unique = true)
    private long seq;

    private String actorId;
    private String actorEmail;
    private String clientIp;
    private String userAgent;
    private String action;
    private String targetType;
    private String targetId;
    private List<ChangedField> changedFields = new ArrayList<>();
    private String reason;
    private String prevHash;
    private String currentHash;
    private Instant createdAt = Instant.now();

    public record ChangedField(
            String field,
            Object oldVal,
            Object newVal
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public long getSeq() { return seq; }
    public void setSeq(long seq) { this.seq = seq; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public List<ChangedField> getChangedFields() { return changedFields; }
    public void setChangedFields(List<ChangedField> changedFields) { this.changedFields = changedFields; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getPrevHash() { return prevHash; }
    public void setPrevHash(String prevHash) { this.prevHash = prevHash; }
    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
