package vn.edu.fit.yitzone.office.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Periodic office inventory audit record tracking discrepancies and surplus items (UC-DUTY-07).
 */
@Document(collection = "OFFICE_INVENTORY_AUDITS")
public class OfficeInventoryAudit {
    @Id
    private String id;

    private String auditTitle;
    private String auditorUserId;
    private Instant auditedAt = Instant.now();
    private List<AuditItem> items = new ArrayList<>();
    private String overallNote;
    private AuditStatus status = AuditStatus.DRAFT;
    private String verifiedBy;
    private Instant verifiedAt;

    public enum AuditStatus {
        DRAFT, COMPLETED_VERIFIED
    }

    public record AuditItem(
            String assetId,
            String assetName,
            int systemQty,
            int actualQty,
            int goodQty,
            int damagedQty,
            int missingQty,
            int surplusQty,
            List<String> proofPhotoUrls,
            String note
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAuditTitle() { return auditTitle; }
    public void setAuditTitle(String auditTitle) { this.auditTitle = auditTitle; }
    public String getAuditorUserId() { return auditorUserId; }
    public void setAuditorUserId(String auditorUserId) { this.auditorUserId = auditorUserId; }
    public Instant getAuditedAt() { return auditedAt; }
    public void setAuditedAt(Instant auditedAt) { this.auditedAt = auditedAt; }
    public List<AuditItem> getItems() { return items; }
    public void setItems(List<AuditItem> items) { this.items = items; }
    public String getOverallNote() { return overallNote; }
    public void setOverallNote(String overallNote) { this.overallNote = overallNote; }
    public AuditStatus getStatus() { return status; }
    public void setStatus(AuditStatus status) { this.status = status; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
}
