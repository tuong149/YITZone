package vn.edu.fit.yitzone.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Compound unique index {eventId, sessionId, attendeeKey} supports students, walk-ins, and lecturers without null collisions (A15).
 */
@Document(collection = "EVENT_ATTENDANCES")
@CompoundIndex(name = "uq_event_session_attendee", def = "{'eventId': 1, 'sessionId': 1, 'attendeeKey': 1}", unique = true)
public class EventAttendance {
    @Id
    private String id;

    private String eventId;
    private String sessionId;
    private String attendeeKey; // e.g., "UID:<userId>" or "SV:<studentCode>"
    private String userId;
    private String studentCodeSnapshot;
    private SsoLinkStatus ssoLinkStatus = SsoLinkStatus.LINKED;
    private ReviewStatus reviewStatus = ReviewStatus.AUTO_ACCEPTED;
    private int riskScore = 0;
    private List<RiskSignal> riskFlags = new ArrayList<>();
    private Instant checkinAt = Instant.now();

    public enum SsoLinkStatus {
        LINKED, PENDING_SSO_LINK
    }

    public enum ReviewStatus {
        AUTO_ACCEPTED, ACCEPTED_LOW_RISK, PENDING_REVIEW, REVIEW_APPROVED, REVIEW_REJECTED
    }

    public enum RiskSignal {
        DEVICE_TOKEN_COLLISION(2),
        GPS_FAR_OUT_OF_RANGE(2),
        IMPOSSIBLE_VELOCITY(2),
        BARCODE_WALKIN_UNVERIFIED(2),
        DUPLICATE_OFFLINE_TICKET_SCAN(2),
        GPS_MODERATE_DRIFT(1),
        ABNORMAL_ACCURACY(1),
        NEW_EPHEMERAL_DEVICE(1),
        GPS_UNAVAILABLE(1);

        private final int weight;

        RiskSignal(int weight) {
            this.weight = weight;
        }

        public int getWeight() {
            return weight;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getAttendeeKey() { return attendeeKey; }
    public void setAttendeeKey(String attendeeKey) { this.attendeeKey = attendeeKey; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getStudentCodeSnapshot() { return studentCodeSnapshot; }
    public void setStudentCodeSnapshot(String studentCodeSnapshot) { this.studentCodeSnapshot = studentCodeSnapshot; }
    public SsoLinkStatus getSsoLinkStatus() { return ssoLinkStatus; }
    public void setSsoLinkStatus(SsoLinkStatus ssoLinkStatus) { this.ssoLinkStatus = ssoLinkStatus; }
    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
    public List<RiskSignal> getRiskFlags() { return riskFlags; }
    public void setRiskFlags(List<RiskSignal> riskFlags) { this.riskFlags = riskFlags; }
    public Instant getCheckinAt() { return checkinAt; }
    public void setCheckinAt(Instant checkinAt) { this.checkinAt = checkinAt; }
}
