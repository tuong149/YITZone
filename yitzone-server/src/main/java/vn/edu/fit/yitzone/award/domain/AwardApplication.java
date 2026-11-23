package vn.edu.fit.yitzone.award.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Student application for SV5T / award campaign with 72-hour appeal workflow (UC-AWD-03, UC-AWD-04, UC-AWD-05).
 */
@Document(collection = "AWARD_APPLICATIONS")
@CompoundIndex(name = "uq_award_app_campaign_user", def = "{'campaignId': 1, 'userId': 1}", unique = true)
public class AwardApplication {
    @Id
    private String id;

    private String campaignId;
    private String userId;
    private String academicYear;
    private List<CriterionSubmission> criteriaSubmissions = new ArrayList<>();
    private AppealInfo appealInfo;
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;
    private Instant submittedAt = Instant.now();
    private Instant reviewedAt;
    private String reviewedBy;
    private String councilFinalDecisionNote;
    private String awardCertificateCode;

    public enum CriterionStatus {
        PENDING, PASS, FAIL, NEEDS_SUPPLEMENT
    }

    public enum ApplicationStatus {
        SUBMITTED, UNDER_REVIEW, NEEDS_SUPPLEMENT, APPEALING, APPROVED, REJECTED
    }

    public record CriterionSubmission(
            String criterionCode,
            CriterionStatus status,
            List<String> internalEvidenceCertIds,
            List<String> externalEvidenceUrls,
            String reviewerNote
    ) {
    }

    public record AppealInfo(
            boolean appealed,
            String appealReason,
            Instant appealedAt,
            String appealDecisionNote,
            String resolvedBy
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public List<CriterionSubmission> getCriteriaSubmissions() { return criteriaSubmissions; }
    public void setCriteriaSubmissions(List<CriterionSubmission> criteriaSubmissions) { this.criteriaSubmissions = criteriaSubmissions; }
    public AppealInfo getAppealInfo() { return appealInfo; }
    public void setAppealInfo(AppealInfo appealInfo) { this.appealInfo = appealInfo; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public String getCouncilFinalDecisionNote() { return councilFinalDecisionNote; }
    public void setCouncilFinalDecisionNote(String councilFinalDecisionNote) { this.councilFinalDecisionNote = councilFinalDecisionNote; }
    public String getAwardCertificateCode() { return awardCertificateCode; }
    public void setAwardCertificateCode(String awardCertificateCode) { this.awardCertificateCode = awardCertificateCode; }
}
