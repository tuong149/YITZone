package vn.edu.fit.yitzone.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Weighted risk review queue for flagged attendance entries with 48-hour SLA (UC-ATT-05).
 */
@Document(collection = "ATTENDANCE_REVIEW_QUEUE")
@CompoundIndex(name = "idx_review_queue_event_status_deadline", def = "{'eventId': 1, 'status': 1, 'reviewDeadlineAt': 1}")
public class AttendanceReviewQueue {
    @Id
    private String id;

    @Indexed(unique = true)
    private String attendanceId;

    private String eventId;
    private String sessionId;
    private String userId;
    private List<EventAttendance.RiskSignal> riskFlags = new ArrayList<>();
    private int riskScore;
    private QueueStatus status = QueueStatus.PENDING;
    private Instant reviewDeadlineAt;
    private String reviewedBy;
    private Instant reviewedAt;
    private String reviewNote;
    private boolean bulkApproved = false;

    public enum QueueStatus {
        PENDING, APPROVED, REJECTED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAttendanceId() { return attendanceId; }
    public void setAttendanceId(String attendanceId) { this.attendanceId = attendanceId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<EventAttendance.RiskSignal> getRiskFlags() { return riskFlags; }
    public void setRiskFlags(List<EventAttendance.RiskSignal> riskFlags) { this.riskFlags = riskFlags; }
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
    public QueueStatus getStatus() { return status; }
    public void setStatus(QueueStatus status) { this.status = status; }
    public Instant getReviewDeadlineAt() { return reviewDeadlineAt; }
    public void setReviewDeadlineAt(Instant reviewDeadlineAt) { this.reviewDeadlineAt = reviewDeadlineAt; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
    public boolean isBulkApproved() { return bulkApproved; }
    public void setBulkApproved(boolean bulkApproved) { this.bulkApproved = bulkApproved; }
}
