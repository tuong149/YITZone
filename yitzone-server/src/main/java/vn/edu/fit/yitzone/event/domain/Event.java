package vn.edu.fit.yitzone.event.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "EVENTS")
@CompoundIndexes({
        @CompoundIndex(name = "idx_events_term_status", def = "{'academicYear': 1, 'semester': 1, 'status': 1}"),
        @CompoundIndex(name = "idx_events_time_visibility", def = "{'startTime': 1, 'endTime': 1, 'visibility': 1}")
})
public class Event {
    @Id
    private String id;

    @Version
    private Long version;

    private String title;
    private String description;
    private EventVisibility visibility = EventVisibility.PUBLIC_FACULTY;
    private String organizerUnitId;
    private List<String> benefitTypes = new ArrayList<>();
    private List<String> cddnEligibleMajorCodes = new ArrayList<>();
    private Instant startTime;
    private Instant endTime;
    private Instant registrationStartTime;
    private Instant registrationEndTime;
    private Instant listLockAt;
    private String academicYear;
    private String semester; // HK1 | HK2 | HK_SUMMER
    private Sv5tCriterion sv5tCriterion;

    private boolean requireCheckout = false;
    private int minPresencePercent = 70;
    private QrCheckinMode qrCheckinMode = QrCheckinMode.DYNAMIC_ROTATING_QR;
    private int qrRotationSeconds = 10;
    private int qrNetworkGraceSeconds = 8;
    private String qrSigningKeyId;
    private boolean allowBarcodeWalkIn = false;
    private List<String> barcodeFormatsAllowed = new ArrayList<>(List.of("CODE_128", "CODE_39"));
    private int hidCharIntervalThresholdMs = 40;
    private boolean indoorNoGpsMode = false;
    private int riskReviewThreshold = 2;
    private int minRequiredSessions = 1;
    private List<AttendanceSession> attendanceSessions = new ArrayList<>();

    private NoShowPolicy noShowPolicy = new NoShowPolicy(true, 3, 14);
    private Integer maxAttendees;
    private OrganizerRecruitmentScope organizerRecruitmentScope = OrganizerRecruitmentScope.FACULTY_WIDE;
    private List<OrganizerPosition> organizerPositions = new ArrayList<>();
    private RegistrationFormConfig registrationFormConfig;

    private String surveyId;
    private boolean requireSurveyForCert = false;
    private boolean exemptOrganizersFromSurvey = true;

    private String status = "DRAFT";
    private String createdBy;
    private String approvedBy;
    private Instant approvedAt;

    public enum EventVisibility {
        PUBLIC_FACULTY,
        INTERNAL_CTV
    }

    public enum Sv5tCriterion {
        ETHICS, STUDY, FITNESS, VOLUNTEER, INTEGRATION
    }

    public enum QrCheckinMode {
        DYNAMIC_ROTATING_QR, STATIC_QR
    }

    public enum OrganizerRecruitmentScope {
        INTERNAL_CTV_ONLY, FACULTY_WIDE
    }

    public enum FormMode {
        ONE_CLICK, CUSTOM_FORM
    }

    public enum CustomFieldType {
        SHORT_TEXT, LONG_TEXT, SINGLE_CHOICE, CONSENT_CHECKBOX
    }

    public record AttendanceSession(
            String sessionId,
            String title,
            Instant startTime,
            Instant endTime,
            boolean required,
            @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
            GeoJsonPoint checkinLocation,
            Integer checkinRadiusMeters,
            GeoJsonPoint checkoutLocation,
            Integer checkoutRadiusMeters
    ) {
    }

    public record NoShowPolicy(
            boolean enabled,
            int thresholdCount,
            int lockDurationDays
    ) {
    }

    public record OrganizerPosition(
            String positionId,
            String code,
            String name,
            boolean enabled,
            int slots,
            String description
    ) {
    }

    public record CustomFormField(
            String fieldId,
            String label,
            CustomFieldType fieldType,
            List<String> options,
            boolean required
    ) {
    }

    public record RegistrationFormConfig(
            FormMode attendeeMode,
            List<CustomFormField> attendeeCustomFields,
            List<CustomFormField> organizerCustomFields
    ) {
    }

    public boolean isInternalCtvWithoutBenefits() {
        return visibility == EventVisibility.INTERNAL_CTV
                && (benefitTypes == null || benefitTypes.isEmpty());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public EventVisibility getVisibility() { return visibility; }
    public void setVisibility(EventVisibility visibility) { this.visibility = visibility; }
    public String getOrganizerUnitId() { return organizerUnitId; }
    public void setOrganizerUnitId(String organizerUnitId) { this.organizerUnitId = organizerUnitId; }
    public List<String> getBenefitTypes() { return benefitTypes; }
    public void setBenefitTypes(List<String> benefitTypes) { this.benefitTypes = benefitTypes; }
    public List<String> getCddnEligibleMajorCodes() { return cddnEligibleMajorCodes; }
    public void setCddnEligibleMajorCodes(List<String> cddnEligibleMajorCodes) { this.cddnEligibleMajorCodes = cddnEligibleMajorCodes; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public Instant getRegistrationStartTime() { return registrationStartTime; }
    public void setRegistrationStartTime(Instant registrationStartTime) { this.registrationStartTime = registrationStartTime; }
    public Instant getRegistrationEndTime() { return registrationEndTime; }
    public void setRegistrationEndTime(Instant registrationEndTime) { this.registrationEndTime = registrationEndTime; }
    public Instant getListLockAt() { return listLockAt; }
    public void setListLockAt(Instant listLockAt) { this.listLockAt = listLockAt; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public Sv5tCriterion getSv5tCriterion() { return sv5tCriterion; }
    public void setSv5tCriterion(Sv5tCriterion sv5tCriterion) { this.sv5tCriterion = sv5tCriterion; }
    public boolean isRequireCheckout() { return requireCheckout; }
    public void setRequireCheckout(boolean requireCheckout) { this.requireCheckout = requireCheckout; }
    public int getMinPresencePercent() { return minPresencePercent; }
    public void setMinPresencePercent(int minPresencePercent) { this.minPresencePercent = minPresencePercent; }
    public QrCheckinMode getQrCheckinMode() { return qrCheckinMode; }
    public void setQrCheckinMode(QrCheckinMode qrCheckinMode) { this.qrCheckinMode = qrCheckinMode; }
    public int getQrRotationSeconds() { return qrRotationSeconds; }
    public void setQrRotationSeconds(int qrRotationSeconds) { this.qrRotationSeconds = qrRotationSeconds; }
    public int getQrNetworkGraceSeconds() { return qrNetworkGraceSeconds; }
    public void setQrNetworkGraceSeconds(int qrNetworkGraceSeconds) { this.qrNetworkGraceSeconds = qrNetworkGraceSeconds; }
    public String getQrSigningKeyId() { return qrSigningKeyId; }
    public void setQrSigningKeyId(String qrSigningKeyId) { this.qrSigningKeyId = qrSigningKeyId; }
    public boolean isAllowBarcodeWalkIn() { return allowBarcodeWalkIn; }
    public void setAllowBarcodeWalkIn(boolean allowBarcodeWalkIn) { this.allowBarcodeWalkIn = allowBarcodeWalkIn; }
    public List<String> getBarcodeFormatsAllowed() { return barcodeFormatsAllowed; }
    public void setBarcodeFormatsAllowed(List<String> barcodeFormatsAllowed) { this.barcodeFormatsAllowed = barcodeFormatsAllowed; }
    public int getHidCharIntervalThresholdMs() { return hidCharIntervalThresholdMs; }
    public void setHidCharIntervalThresholdMs(int hidCharIntervalThresholdMs) { this.hidCharIntervalThresholdMs = hidCharIntervalThresholdMs; }
    public boolean isIndoorNoGpsMode() { return indoorNoGpsMode; }
    public void setIndoorNoGpsMode(boolean indoorNoGpsMode) { this.indoorNoGpsMode = indoorNoGpsMode; }
    public int getRiskReviewThreshold() { return riskReviewThreshold; }
    public void setRiskReviewThreshold(int riskReviewThreshold) { this.riskReviewThreshold = riskReviewThreshold; }
    public int getMinRequiredSessions() { return minRequiredSessions; }
    public void setMinRequiredSessions(int minRequiredSessions) { this.minRequiredSessions = minRequiredSessions; }
    public List<AttendanceSession> getAttendanceSessions() { return attendanceSessions; }
    public void setAttendanceSessions(List<AttendanceSession> attendanceSessions) { this.attendanceSessions = attendanceSessions; }
    public NoShowPolicy getNoShowPolicy() { return noShowPolicy; }
    public void setNoShowPolicy(NoShowPolicy noShowPolicy) { this.noShowPolicy = noShowPolicy; }
    public Integer getMaxAttendees() { return maxAttendees; }
    public void setMaxAttendees(Integer maxAttendees) { this.maxAttendees = maxAttendees; }
    public OrganizerRecruitmentScope getOrganizerRecruitmentScope() { return organizerRecruitmentScope; }
    public void setOrganizerRecruitmentScope(OrganizerRecruitmentScope organizerRecruitmentScope) { this.organizerRecruitmentScope = organizerRecruitmentScope; }
    public List<OrganizerPosition> getOrganizerPositions() { return organizerPositions; }
    public void setOrganizerPositions(List<OrganizerPosition> organizerPositions) { this.organizerPositions = organizerPositions; }
    public RegistrationFormConfig getRegistrationFormConfig() { return registrationFormConfig; }
    public void setRegistrationFormConfig(RegistrationFormConfig registrationFormConfig) { this.registrationFormConfig = registrationFormConfig; }
    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
    public boolean isRequireSurveyForCert() { return requireSurveyForCert; }
    public void setRequireSurveyForCert(boolean requireSurveyForCert) { this.requireSurveyForCert = requireSurveyForCert; }
    public boolean isExemptOrganizersFromSurvey() { return exemptOrganizersFromSurvey; }
    public void setExemptOrganizersFromSurvey(boolean exemptOrganizersFromSurvey) { this.exemptOrganizersFromSurvey = exemptOrganizersFromSurvey; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }
}
