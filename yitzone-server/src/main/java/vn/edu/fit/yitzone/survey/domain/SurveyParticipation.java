package vn.edu.fit.yitzone.survey.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Separate participation ledger enforcing 1 submission per user without linking to anonymous responses (UC-SUR-02).
 */
@Document(collection = "SURVEY_PARTICIPATIONS")
@CompoundIndex(name = "uq_survey_participation_survey_user", def = "{'surveyId': 1, 'userId': 1}", unique = true)
public class SurveyParticipation {
    @Id
    private String id;

    private String surveyId;
    private String userId;
    private String submittedDateBucket; // YYYY-MM-DD

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSubmittedDateBucket() { return submittedDateBucket; }
    public void setSubmittedDateBucket(String submittedDateBucket) { this.submittedDateBucket = submittedDateBucket; }
}
