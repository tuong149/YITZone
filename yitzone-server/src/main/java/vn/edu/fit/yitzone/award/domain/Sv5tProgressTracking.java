package vn.edu.fit.yitzone.award.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Year-long SV5T goal registration and 5-criteria progress tracking (UC-AWD-02).
 */
@Document(collection = "SV5T_PROGRESS_TRACKING")
@CompoundIndex(name = "uq_sv5t_progress_user_year", def = "{'userId': 1, 'academicYear': 1}", unique = true)
public class Sv5tProgressTracking {
    @Id
    private String id;

    private String userId;
    private String academicYear;
    private AwardCampaign.AwardLevel targetLevel = AwardCampaign.AwardLevel.FACULTY;
    private List<CriterionProgress> criteriaProgress = new ArrayList<>();
    private String mentorNote;
    private Instant lastCheckedAt = Instant.now();

    public record CriterionProgress(
            String criterionCode,
            boolean completed,
            boolean awaitingExternalProof,
            List<String> autoMatchedCertIds,
            List<String> manualEvidenceUrls
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public AwardCampaign.AwardLevel getTargetLevel() { return targetLevel; }
    public void setTargetLevel(AwardCampaign.AwardLevel targetLevel) { this.targetLevel = targetLevel; }
    public List<CriterionProgress> getCriteriaProgress() { return criteriaProgress; }
    public void setCriteriaProgress(List<CriterionProgress> criteriaProgress) { this.criteriaProgress = criteriaProgress; }
    public String getMentorNote() { return mentorNote; }
    public void setMentorNote(String mentorNote) { this.mentorNote = mentorNote; }
    public Instant getLastCheckedAt() { return lastCheckedAt; }
    public void setLastCheckedAt(Instant lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }
}
