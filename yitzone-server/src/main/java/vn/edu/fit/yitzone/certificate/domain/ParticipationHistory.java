package vn.edu.fit.yitzone.certificate.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Verified event participation history and versioned E-Certificate record (UC-CERT-01..05).
 */
@Document(collection = "PARTICIPATION_HISTORIES")
@CompoundIndexes({
        @CompoundIndex(name = "uq_participation_user_event", def = "{'userId': 1, 'eventId': 1}", unique = true),
        @CompoundIndex(name = "idx_participation_user_term", def = "{'userId': 1, 'academicYear': 1, 'semester': 1}")
})
public class ParticipationHistory {
    @Id
    private String id;

    private String userId;
    private String eventId;
    private String eventTitleSnapshot;
    private String academicYear;
    private String semester;
    private List<String> benefits = new ArrayList<>(); // DRL, CTXH, CDDN
    private String benefitNote;
    private boolean benefitOverridden = false;
    private String overrideBy;
    private String overrideReason;

    private ParticipationRole participationRole = ParticipationRole.ATTENDEE;
    private String organizerPosition;
    private List<String> secondaryRoles = new ArrayList<>();

    @Indexed(unique = true, sparse = true)
    private String certificateCode;
    private int certVersion = 1;
    private CertStatus certStatus = CertStatus.VALID;
    private String revokedReason;
    private String revokedBy;
    private Instant revokedAt;
    private String supersededBy;
    private String certificatePdfUrl;
    private Instant issuedAt = Instant.now();

    public enum ParticipationRole {
        ATTENDEE, ORGANIZER
    }

    public enum CertStatus {
        VALID, REVOKED, SUPERSEDED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getEventTitleSnapshot() { return eventTitleSnapshot; }
    public void setEventTitleSnapshot(String eventTitleSnapshot) { this.eventTitleSnapshot = eventTitleSnapshot; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public List<String> getBenefits() { return benefits; }
    public void setBenefits(List<String> benefits) { this.benefits = benefits; }
    public String getBenefitNote() { return benefitNote; }
    public void setBenefitNote(String benefitNote) { this.benefitNote = benefitNote; }
    public boolean isBenefitOverridden() { return benefitOverridden; }
    public void setBenefitOverridden(boolean benefitOverridden) { this.benefitOverridden = benefitOverridden; }
    public String getOverrideBy() { return overrideBy; }
    public void setOverrideBy(String overrideBy) { this.overrideBy = overrideBy; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public ParticipationRole getParticipationRole() { return participationRole; }
    public void setParticipationRole(ParticipationRole participationRole) { this.participationRole = participationRole; }
    public String getOrganizerPosition() { return organizerPosition; }
    public void setOrganizerPosition(String organizerPosition) { this.organizerPosition = organizerPosition; }
    public List<String> getSecondaryRoles() { return secondaryRoles; }
    public void setSecondaryRoles(List<String> secondaryRoles) { this.secondaryRoles = secondaryRoles; }
    public String getCertificateCode() { return certificateCode; }
    public void setCertificateCode(String certificateCode) { this.certificateCode = certificateCode; }
    public int getCertVersion() { return certVersion; }
    public void setCertVersion(int certVersion) { this.certVersion = certVersion; }
    public CertStatus getCertStatus() { return certStatus; }
    public void setCertStatus(CertStatus certStatus) { this.certStatus = certStatus; }
    public String getRevokedReason() { return revokedReason; }
    public void setRevokedReason(String revokedReason) { this.revokedReason = revokedReason; }
    public String getRevokedBy() { return revokedBy; }
    public void setRevokedBy(String revokedBy) { this.revokedBy = revokedBy; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
    public String getSupersededBy() { return supersededBy; }
    public void setSupersededBy(String supersededBy) { this.supersededBy = supersededBy; }
    public String getCertificatePdfUrl() { return certificatePdfUrl; }
    public void setCertificatePdfUrl(String certificatePdfUrl) { this.certificatePdfUrl = certificatePdfUrl; }
    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }
}
