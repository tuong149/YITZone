package vn.edu.fit.yitzone.liveqa.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Live Q&A question with real-time union-merge upvoting and masked-author accountability (UC-QA-02..04).
 */
@Document(collection = "LIVE_QA_QUESTIONS")
@CompoundIndex(name = "idx_liveqa_q_session_status_rank", def = "{'sessionId': 1, 'status': 1, 'pinned': -1, 'upvoteCount': -1}")
public class LiveQaQuestion {
    @Id
    private String id;

    private String sessionId;
    private String eventId;
    private String authorUserId; // Always stored internally for MOD_LIVEQA_UNMASK accountability
    private String authorDisplayName;
    private boolean anonymousOnStage = false;
    private String content;
    private String speakerTarget;
    private int upvoteCount = 0;
    private List<String> upvotedUserIds = new ArrayList<>();
    private boolean pinned = false;
    private boolean submittedPostEvent = false;
    private List<String> mergedFromQuestionIds = new ArrayList<>();
    private QuestionStatus status = QuestionStatus.PENDING_MODERATION;
    private String moderatedBy;
    private Instant createdAt = Instant.now();

    public enum QuestionStatus {
        PENDING_MODERATION, PUBLISHED, HIGHLIGHTED, ANSWERED, REJECTED, MERGED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }
    public String getAuthorDisplayName() { return authorDisplayName; }
    public void setAuthorDisplayName(String authorDisplayName) { this.authorDisplayName = authorDisplayName; }
    public boolean isAnonymousOnStage() { return anonymousOnStage; }
    public void setAnonymousOnStage(boolean anonymousOnStage) { this.anonymousOnStage = anonymousOnStage; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSpeakerTarget() { return speakerTarget; }
    public void setSpeakerTarget(String speakerTarget) { this.speakerTarget = speakerTarget; }
    public int getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(int upvoteCount) { this.upvoteCount = upvoteCount; }
    public List<String> getUpvotedUserIds() { return upvotedUserIds; }
    public void setUpvotedUserIds(List<String> upvotedUserIds) { this.upvotedUserIds = upvotedUserIds; }
    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
    public boolean isSubmittedPostEvent() { return submittedPostEvent; }
    public void setSubmittedPostEvent(boolean submittedPostEvent) { this.submittedPostEvent = submittedPostEvent; }
    public List<String> getMergedFromQuestionIds() { return mergedFromQuestionIds; }
    public void setMergedFromQuestionIds(List<String> mergedFromQuestionIds) { this.mergedFromQuestionIds = mergedFromQuestionIds; }
    public QuestionStatus getStatus() { return status; }
    public void setStatus(QuestionStatus status) { this.status = status; }
    public String getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(String moderatedBy) { this.moderatedBy = moderatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
