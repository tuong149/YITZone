package vn.edu.fit.yitzone.arts.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Performing arts act registration, stage technical files, run-of-show order, and 20-minute emergency unlock (UC-ART-01..03).
 */
@Document(collection = "PERFORMANCE_ACTS")
@CompoundIndexes({
        @CompoundIndex(name = "idx_perf_act_event_order", def = "{'eventId': 1, 'stageOrderIndex': 1}"),
        @CompoundIndex(name = "idx_perf_act_performer_user", def = "{'performers.userId': 1}")
})
public class PerformanceAct {
    @Id
    private String id;

    private String eventId;
    private String actTitle;
    private ActCategory actCategory;
    private int durationSeconds;
    private int stageOrderIndex;
    private Instant rehearsalStartTime;
    private Instant rehearsalEndTime;
    private String rehearsalLocation;
    private List<Performer> performers = new ArrayList<>();
    private TechnicalSources technicalSources;
    private StageSetupRequirements stageSetupRequirements;
    private ActStatus status = ActStatus.SUBMITTED;
    private String reviewNote;
    private String approvedBy;
    private String emergencyUnlockBy;
    private Instant emergencyUnlockExpiresAt;

    public enum ActCategory {
        SOLO_VOCAL, GROUP_VOCAL, DANCE, INSTRUMENTAL_BAND, DRAMA
    }

    public enum ActStatus {
        SUBMITTED, REHEARSAL_PENDING, REVISION_REQUIRED, STAGE_READY, REJECTED
    }

    public record Performer(
            String userId,
            String studentCode,
            String fullName,
            String roleInAct,
            boolean guestPerformer,
            String guestFullName,
            String guestOrganization
    ) {
    }

    public record TechnicalSources(
            String audioBeatUrl,
            String visualBackgroundUrl,
            String lyricsOrScriptUrl,
            String lightingAndSoundCueNote
    ) {
    }

    public record StageSetupRequirements(
            int handheldMics,
            int headsetMics,
            int instrumentJacks,
            String propsNote
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getActTitle() { return actTitle; }
    public void setActTitle(String actTitle) { this.actTitle = actTitle; }
    public ActCategory getActCategory() { return actCategory; }
    public void setActCategory(ActCategory actCategory) { this.actCategory = actCategory; }
    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
    public int getStageOrderIndex() { return stageOrderIndex; }
    public void setStageOrderIndex(int stageOrderIndex) { this.stageOrderIndex = stageOrderIndex; }
    public Instant getRehearsalStartTime() { return rehearsalStartTime; }
    public void setRehearsalStartTime(Instant rehearsalStartTime) { this.rehearsalStartTime = rehearsalStartTime; }
    public Instant getRehearsalEndTime() { return rehearsalEndTime; }
    public void setRehearsalEndTime(Instant rehearsalEndTime) { this.rehearsalEndTime = rehearsalEndTime; }
    public String getRehearsalLocation() { return rehearsalLocation; }
    public void setRehearsalLocation(String rehearsalLocation) { this.rehearsalLocation = rehearsalLocation; }
    public List<Performer> getPerformers() { return performers; }
    public void setPerformers(List<Performer> performers) { this.performers = performers; }
    public TechnicalSources getTechnicalSources() { return technicalSources; }
    public void setTechnicalSources(TechnicalSources technicalSources) { this.technicalSources = technicalSources; }
    public StageSetupRequirements getStageSetupRequirements() { return stageSetupRequirements; }
    public void setStageSetupRequirements(StageSetupRequirements stageSetupRequirements) { this.stageSetupRequirements = stageSetupRequirements; }
    public ActStatus getStatus() { return status; }
    public void setStatus(ActStatus status) { this.status = status; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getEmergencyUnlockBy() { return emergencyUnlockBy; }
    public void setEmergencyUnlockBy(String emergencyUnlockBy) { this.emergencyUnlockBy = emergencyUnlockBy; }
    public Instant getEmergencyUnlockExpiresAt() { return emergencyUnlockExpiresAt; }
    public void setEmergencyUnlockExpiresAt(Instant emergencyUnlockExpiresAt) { this.emergencyUnlockExpiresAt = emergencyUnlockExpiresAt; }
}
