package vn.edu.fit.yitzone.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Compound unique index {eventId, sessionId, attendeeKey} supports students, walk-ins, and lecturers without null collisions (A15).
 */
@Document(collection = "EVENT_ATTENDANCES")
@CompoundIndexes({
        @CompoundIndex(name = "uq_event_session_attendee", def = "{'eventId': 1, 'sessionId': 1, 'attendeeKey': 1}", unique = true),
        @CompoundIndex(name = "idx_att_student_sso_link", def = "{'studentCodeSnapshot': 1, 'ssoLinkStatus': 1}"),
        @CompoundIndex(name = "idx_att_device_collision", def = "{'eventId': 1, 'sessionId': 1, 'checkinDeviceTokenId': 1}")
})
public class EventAttendance {
    @Id
    private String id;

    private String eventId;
    private String sessionId;
    private String attendeeKey; // e.g., "UID:<userId>" or "SV:<studentCode>"
    private String userId;
    private String studentCodeSnapshot;
    private SsoLinkStatus ssoLinkStatus = SsoLinkStatus.LINKED;
    private Instant ssoLinkedAt;

    @Indexed
    private Instant orphanExpiresAt;

    private ReviewStatus reviewStatus = ReviewStatus.AUTO_ACCEPTED;
    private int riskScore = 0;
    private List<RiskSignal> riskFlags = new ArrayList<>();
    private Instant checkinAt = Instant.now();
    private Instant checkoutAt;
    private AttendanceSource source;
    private BarcodeHardwareType barcodeHardwareType;
    private boolean physicalCardVerifiedByStaff = false;
    private String checkinDeviceTokenId;
    private String checkoutDeviceTokenId;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint checkinLocation;
    private Double gpsAccuracyMeters;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint checkoutLocation;
    private Double checkoutGpsAccuracyMeters;

    private String scannerDeviceId;
    private Instant syncedAt;
    private Integer localSeq;
    private boolean manualOverride = false;
    private String overrideBy;
    private String overrideReason;

    public enum SsoLinkStatus {
        LINKED, PENDING_SSO_LINK
    }

    public enum ReviewStatus {
        AUTO_ACCEPTED, ACCEPTED_LOW_RISK, PENDING_REVIEW, REVIEW_APPROVED, REVIEW_REJECTED
    }

    public enum AttendanceSource {
        SELF_DYNAMIC_QR,
        SELF_STATIC_QR,
        BTC_OFFLINE_SCAN,
        BTC_ONLINE_SCAN,
        BTC_BARCODE_ONLINE,
        BTC_BARCODE_OFFLINE,
        MANUAL_OVERRIDE
    }

    public enum BarcodeHardwareType {
        CAMERA_1D, USB_BLUETOOTH_HID
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
    public Instant getSsoLinkedAt() { return ssoLinkedAt; }
    public void setSsoLinkedAt(Instant ssoLinkedAt) { this.ssoLinkedAt = ssoLinkedAt; }
    public Instant getOrphanExpiresAt() { return orphanExpiresAt; }
    public void setOrphanExpiresAt(Instant orphanExpiresAt) { this.orphanExpiresAt = orphanExpiresAt; }
    public ReviewStatus getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
    public List<RiskSignal> getRiskFlags() { return riskFlags; }
    public void setRiskFlags(List<RiskSignal> riskFlags) { this.riskFlags = riskFlags; }
    public Instant getCheckinAt() { return checkinAt; }
    public void setCheckinAt(Instant checkinAt) { this.checkinAt = checkinAt; }
    public Instant getCheckoutAt() { return checkoutAt; }
    public void setCheckoutAt(Instant checkoutAt) { this.checkoutAt = checkoutAt; }
    public AttendanceSource getSource() { return source; }
    public void setSource(AttendanceSource source) { this.source = source; }
    public BarcodeHardwareType getBarcodeHardwareType() { return barcodeHardwareType; }
    public void setBarcodeHardwareType(BarcodeHardwareType barcodeHardwareType) { this.barcodeHardwareType = barcodeHardwareType; }
    public boolean isPhysicalCardVerifiedByStaff() { return physicalCardVerifiedByStaff; }
    public void setPhysicalCardVerifiedByStaff(boolean physicalCardVerifiedByStaff) { this.physicalCardVerifiedByStaff = physicalCardVerifiedByStaff; }
    public String getCheckinDeviceTokenId() { return checkinDeviceTokenId; }
    public void setCheckinDeviceTokenId(String checkinDeviceTokenId) { this.checkinDeviceTokenId = checkinDeviceTokenId; }
    public String getCheckoutDeviceTokenId() { return checkoutDeviceTokenId; }
    public void setCheckoutDeviceTokenId(String checkoutDeviceTokenId) { this.checkoutDeviceTokenId = checkoutDeviceTokenId; }
    public GeoJsonPoint getCheckinLocation() { return checkinLocation; }
    public void setCheckinLocation(GeoJsonPoint checkinLocation) { this.checkinLocation = checkinLocation; }
    public Double getGpsAccuracyMeters() { return gpsAccuracyMeters; }
    public void setGpsAccuracyMeters(Double gpsAccuracyMeters) { this.gpsAccuracyMeters = gpsAccuracyMeters; }
    public GeoJsonPoint getCheckoutLocation() { return checkoutLocation; }
    public void setCheckoutLocation(GeoJsonPoint checkoutLocation) { this.checkoutLocation = checkoutLocation; }
    public Double getCheckoutGpsAccuracyMeters() { return checkoutGpsAccuracyMeters; }
    public void setCheckoutGpsAccuracyMeters(Double checkoutGpsAccuracyMeters) { this.checkoutGpsAccuracyMeters = checkoutGpsAccuracyMeters; }
    public String getScannerDeviceId() { return scannerDeviceId; }
    public void setScannerDeviceId(String scannerDeviceId) { this.scannerDeviceId = scannerDeviceId; }
    public Instant getSyncedAt() { return syncedAt; }
    public void setSyncedAt(Instant syncedAt) { this.syncedAt = syncedAt; }
    public Integer getLocalSeq() { return localSeq; }
    public void setLocalSeq(Integer localSeq) { this.localSeq = localSeq; }
    public boolean isManualOverride() { return manualOverride; }
    public void setManualOverride(boolean manualOverride) { this.manualOverride = manualOverride; }
    public String getOverrideBy() { return overrideBy; }
    public void setOverrideBy(String overrideBy) { this.overrideBy = overrideBy; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
}
