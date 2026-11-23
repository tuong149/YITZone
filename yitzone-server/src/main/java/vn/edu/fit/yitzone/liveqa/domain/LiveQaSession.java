package vn.edu.fit.yitzone.liveqa.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Live hall Q&A wall session linked to an event (UC-QA-01..03).
 */
@Document(collection = "LIVE_QA_SESSIONS")
@CompoundIndex(name = "idx_liveqa_session_event_status", def = "{'eventId': 1, 'status': 1}")
public class LiveQaSession {
    @Id
    private String id;

    private String eventId;

    @Indexed(unique = true)
    private String pinCode;

    private String title;
    private boolean requireModeration = true;
    private boolean allowAnonymousDisplay = true;
    private int maxQuestionsPerWindow = 2;
    private int rateLimitWindowMinutes = 5;
    private String highlightedQuestionId;
    private SessionStatus status = SessionStatus.OPEN;
    private String createdBy;
    private Instant createdAt = Instant.now();

    public enum SessionStatus {
        OPEN, PAUSED, CLOSED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isRequireModeration() { return requireModeration; }
    public void setRequireModeration(boolean requireModeration) { this.requireModeration = requireModeration; }
    public boolean isAllowAnonymousDisplay() { return allowAnonymousDisplay; }
    public void setAllowAnonymousDisplay(boolean allowAnonymousDisplay) { this.allowAnonymousDisplay = allowAnonymousDisplay; }
    public int getMaxQuestionsPerWindow() { return maxQuestionsPerWindow; }
    public void setMaxQuestionsPerWindow(int maxQuestionsPerWindow) { this.maxQuestionsPerWindow = maxQuestionsPerWindow; }
    public int getRateLimitWindowMinutes() { return rateLimitWindowMinutes; }
    public void setRateLimitWindowMinutes(int rateLimitWindowMinutes) { this.rateLimitWindowMinutes = rateLimitWindowMinutes; }
    public String getHighlightedQuestionId() { return highlightedQuestionId; }
    public void setHighlightedQuestionId(String highlightedQuestionId) { this.highlightedQuestionId = highlightedQuestionId; }
    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
