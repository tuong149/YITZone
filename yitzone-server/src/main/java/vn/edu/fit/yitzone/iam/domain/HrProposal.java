package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * 3-tier internal HR proposal workflow (UC-IAM-07, UC-IAM-08):
 * Deputy Team Leader / Vice Committee Head proposes; Team Leader / Committee Head approves.
 */
@Document(collection = "HR_PROPOSALS")
@CompoundIndex(name = "idx_hr_proposals_unit_status", def = "{'unitId': 1, 'status': 1, 'createdAt': -1}")
public class HrProposal {
    @Id
    private String id;

    private String unitId;
    private String targetUserId;
    private ProposalType proposalType;
    private String targetTransferUnitId;
    private User.MemberStatus targetMemberStatus;
    private String reason;
    private ProposalStatus status = ProposalStatus.PENDING;
    private String proposedBy;
    private Instant createdAt = Instant.now();
    private String reviewedBy;
    private Instant reviewedAt;
    private String reviewNote;

    public enum ProposalType {
        ONBOARD_CTV,
        UPDATE_CTV_PROFILE,
        TRANSFER_TEAM,
        CHANGE_MEMBER_STATUS
    }

    public enum ProposalStatus {
        PENDING, APPROVED, REJECTED, CANCELLED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUnitId() { return unitId; }
    public void setUnitId(String unitId) { this.unitId = unitId; }
    public String getTargetUserId() { return targetUserId; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
    public ProposalType getProposalType() { return proposalType; }
    public void setProposalType(ProposalType proposalType) { this.proposalType = proposalType; }
    public String getTargetTransferUnitId() { return targetTransferUnitId; }
    public void setTargetTransferUnitId(String targetTransferUnitId) { this.targetTransferUnitId = targetTransferUnitId; }
    public User.MemberStatus getTargetMemberStatus() { return targetMemberStatus; }
    public void setTargetMemberStatus(User.MemberStatus targetMemberStatus) { this.targetMemberStatus = targetMemberStatus; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public ProposalStatus getStatus() { return status; }
    public void setStatus(ProposalStatus status) { this.status = status; }
    public String getProposedBy() { return proposedBy; }
    public void setProposedBy(String proposedBy) { this.proposedBy = proposedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
}
