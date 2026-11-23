package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Scoped Personnel Restructuring Batch (UC-IAM-06: Đợt Kiện toàn Theo Đơn vị).
 */
@Document(collection = "RESTRUCTURING_BATCHES")
@CompoundIndex(name = "idx_restructuring_status_effective", def = "{'status': 1, 'effectiveAt': 1}")
public class RestructuringBatch {
    @Id
    private String id;

    private String title;
    private String termYear;
    private List<String> targetUnitIds = new ArrayList<>();
    private List<PersonnelChangeItem> changes = new ArrayList<>();
    private List<HandoverWarning> handoverWarnings = new ArrayList<>();
    private BatchStatus status = BatchStatus.DRAFT;
    private Instant effectiveAt;
    private Instant appliedAt;
    private String createdBy;
    private String approvedBy;
    private Instant createdAt = Instant.now();

    public enum BatchStatus {
        DRAFT, SCHEDULED, APPLIED, CANCELLED
    }

    public enum ChangeAction {
        KEEP, RESIGN_OR_DISMISS, CHANGE_ROLE, NEW_APPOINTMENT
    }

    public record PersonnelChangeItem(
            String userId,
            ChangeAction action,
            RoleCode previousRoleCode,
            ExecutivePositionTitle previousPositionTitle,
            String previousUnitId,
            RoleCode newRoleCode,
            ExecutivePositionTitle newPositionTitle,
            String newUnitId,
            String note
    ) {
    }

    public record HandoverWarning(
            String userId,
            String warningType,
            String details
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTermYear() { return termYear; }
    public void setTermYear(String termYear) { this.termYear = termYear; }
    public List<String> getTargetUnitIds() { return targetUnitIds; }
    public void setTargetUnitIds(List<String> targetUnitIds) { this.targetUnitIds = targetUnitIds; }
    public List<PersonnelChangeItem> getChanges() { return changes; }
    public void setChanges(List<PersonnelChangeItem> changes) { this.changes = changes; }
    public List<HandoverWarning> getHandoverWarnings() { return handoverWarnings; }
    public void setHandoverWarnings(List<HandoverWarning> handoverWarnings) { this.handoverWarnings = handoverWarnings; }
    public BatchStatus getStatus() { return status; }
    public void setStatus(BatchStatus status) { this.status = status; }
    public Instant getEffectiveAt() { return effectiveAt; }
    public void setEffectiveAt(Instant effectiveAt) { this.effectiveAt = effectiveAt; }
    public Instant getAppliedAt() { return appliedAt; }
    public void setAppliedAt(Instant appliedAt) { this.appliedAt = appliedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
