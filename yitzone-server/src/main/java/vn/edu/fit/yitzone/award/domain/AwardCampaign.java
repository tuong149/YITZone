package vn.edu.fit.yitzone.award.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Award & SV5T evaluation campaign with dynamic CRUD 5-criteria tree (UC-AWD-01, UC-AWD-05).
 */
@Document(collection = "AWARD_CAMPAIGNS")
public class AwardCampaign {
    @Id
    private String id;

    private String title;
    private String academicYear;
    private AwardLevel awardLevel = AwardLevel.FACULTY;
    private List<CriterionNode> criteriaTree = new ArrayList<>();
    private Instant startDate;
    private Instant endDate;
    private Instant appealDeadlineAt;
    private CampaignStatus status = CampaignStatus.DRAFT;
    private String createdBy;
    private String finalizedBy;
    private Instant finalizedAt;

    public enum AwardLevel {
        FACULTY, UNIVERSITY, CITY
    }

    public enum CampaignStatus {
        DRAFT, OPEN, PRELIMINARY_REVIEW, APPEAL_OPEN, FINALIZED
    }

    public enum EvidenceSourceType {
        SYSTEM_EVENT, EXTERNAL_PROOF
    }

    public record SubCriterion(
            String subId,
            String title,
            String description,
            EvidenceSourceType sourceType,
            String linkedEventTag,
            boolean active
    ) {
    }

    public record CriterionNode(
            String criterionId,
            String code, // ETHICS, STUDY, FITNESS, VOLUNTEER, INTEGRATION
            String name,
            List<SubCriterion> mandatorySubCriteria,
            List<SubCriterion> optionalSubCriteria,
            int minOptionalRequired
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public AwardLevel getAwardLevel() { return awardLevel; }
    public void setAwardLevel(AwardLevel awardLevel) { this.awardLevel = awardLevel; }
    public List<CriterionNode> getCriteriaTree() { return criteriaTree; }
    public void setCriteriaTree(List<CriterionNode> criteriaTree) { this.criteriaTree = criteriaTree; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public Instant getAppealDeadlineAt() { return appealDeadlineAt; }
    public void setAppealDeadlineAt(Instant appealDeadlineAt) { this.appealDeadlineAt = appealDeadlineAt; }
    public CampaignStatus getStatus() { return status; }
    public void setStatus(CampaignStatus status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getFinalizedBy() { return finalizedBy; }
    public void setFinalizedBy(String finalizedBy) { this.finalizedBy = finalizedBy; }
    public Instant getFinalizedAt() { return finalizedAt; }
    public void setFinalizedAt(Instant finalizedAt) { this.finalizedAt = finalizedAt; }
}
