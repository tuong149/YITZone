package vn.edu.fit.yitzone.survey.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Survey form definition supporting 3 scopes, identified/anonymous modes, and AI summary cache (UC-SUR-01, UC-SUR-03).
 */
@Document(collection = "SURVEYS")
@CompoundIndex(name = "idx_survey_type_status_end", def = "{'surveyType': 1, 'status': 1, 'endTime': 1}")
public class Survey {
    @Id
    private String id;

    private String title;
    private String description;
    private SurveyType surveyType = SurveyType.EVENT_FEEDBACK;
    private String eventId;
    private String targetUnitId;
    private boolean anonymous = false;
    private boolean requireForCertificate = false;
    private Instant startTime;
    private Instant endTime;
    private List<SurveyQuestion> questions = new ArrayList<>();
    private AiSummaryCache aiSummaryCache;
    private SurveyStatus status = SurveyStatus.DRAFT;
    private String createdBy;

    public enum SurveyType {
        EVENT_FEEDBACK, FACULTY_WIDE_SURVEY, INTERNAL_UNIT_POLL
    }

    public enum QuestionType {
        STAR_RATING_5,
        LIKERT_5,
        SINGLE_CHOICE_WITH_OTHER,
        MULTI_CHOICE,
        OPEN_TEXT
    }

    public enum SurveyStatus {
        DRAFT, PUBLISHED, CLOSED
    }

    public record SurveyQuestion(
            String questionId,
            String questionText,
            QuestionType type,
            List<String> options,
            boolean required
    ) {
    }

    public record AiSummaryCache(
            List<String> positiveHighlights,
            List<String> improvementAreas,
            List<String> studentSuggestions,
            Instant generatedAt
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public SurveyType getSurveyType() { return surveyType; }
    public void setSurveyType(SurveyType surveyType) { this.surveyType = surveyType; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getTargetUnitId() { return targetUnitId; }
    public void setTargetUnitId(String targetUnitId) { this.targetUnitId = targetUnitId; }
    public boolean isAnonymous() { return anonymous; }
    public void setAnonymous(boolean anonymous) { this.anonymous = anonymous; }
    public boolean isRequireForCertificate() { return requireForCertificate; }
    public void setRequireForCertificate(boolean requireForCertificate) { this.requireForCertificate = requireForCertificate; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public List<SurveyQuestion> getQuestions() { return questions; }
    public void setQuestions(List<SurveyQuestion> questions) { this.questions = questions; }
    public AiSummaryCache getAiSummaryCache() { return aiSummaryCache; }
    public void setAiSummaryCache(AiSummaryCache aiSummaryCache) { this.aiSummaryCache = aiSummaryCache; }
    public SurveyStatus getStatus() { return status; }
    public void setStatus(SurveyStatus status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
