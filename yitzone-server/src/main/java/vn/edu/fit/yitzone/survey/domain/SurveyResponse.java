package vn.edu.fit.yitzone.survey.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Survey answers decoupled from userId and precise timestamps when anonymous (UC-SUR-02, UC-SUR-03).
 */
@Document(collection = "SURVEY_RESPONSES")
@CompoundIndex(name = "idx_survey_response_survey_bucket", def = "{'surveyId': 1, 'submittedDateBucket': 1}")
public class SurveyResponse {
    @Id
    private String id;

    private String surveyId;
    private String eventId;
    private String userId; // MUST be null when Survey.anonymous == true
    private List<QuestionAnswer> answers = new ArrayList<>();
    private String submittedDateBucket; // YYYY-MM-DD (no hh:mm:ss for anonymous)

    public record QuestionAnswer(
            String questionId,
            Integer ratingValue,
            List<String> selectedOptions,
            String textAnswer
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<QuestionAnswer> getAnswers() { return answers; }
    public void setAnswers(List<QuestionAnswer> answers) { this.answers = answers; }
    public String getSubmittedDateBucket() { return submittedDateBucket; }
    public void setSubmittedDateBucket(String submittedDateBucket) { this.submittedDateBucket = submittedDateBucket; }
}
