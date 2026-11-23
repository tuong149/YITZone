package vn.edu.fit.yitzone.event.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Event registration for attendees and organizers with waitlist hold support (UC-EVT-03, UC-EVT-04).
 */
@Document(collection = "EVENT_REGISTRATIONS")
@CompoundIndexes({
        @CompoundIndex(name = "uq_event_reg_event_user", def = "{'eventId': 1, 'userId': 1}", unique = true),
        @CompoundIndex(name = "idx_event_reg_waitlist_hold", def = "{'eventId': 1, 'status': 1, 'holdExpiresAt': 1}")
})
public class EventRegistration {
    @Id
    private String id;

    private String eventId;
    private String userId;
    private RegistrationType registrationType = RegistrationType.ATTENDEE;
    private String organizerPosition;
    private String secondaryOrganizerPosition;
    private List<String> secondaryRoles = new ArrayList<>();
    private String note;
    private List<FormAnswer> formAnswers = new ArrayList<>();
    private RegistrationStatus status = RegistrationStatus.REGISTERED;
    private Instant holdExpiresAt;
    private Instant registeredAt = Instant.now();

    public enum RegistrationType {
        ATTENDEE, ORGANIZER
    }

    public enum RegistrationStatus {
        REGISTERED, WAITLIST, PROMOTED_HOLD, APPROVED, REJECTED, CANCELLED
    }

    public record FormAnswer(
            String fieldId,
            String labelSnapshot,
            Event.CustomFieldType fieldType,
            Object answerValue
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public RegistrationType getRegistrationType() { return registrationType; }
    public void setRegistrationType(RegistrationType registrationType) { this.registrationType = registrationType; }
    public String getOrganizerPosition() { return organizerPosition; }
    public void setOrganizerPosition(String organizerPosition) { this.organizerPosition = organizerPosition; }
    public String getSecondaryOrganizerPosition() { return secondaryOrganizerPosition; }
    public void setSecondaryOrganizerPosition(String secondaryOrganizerPosition) { this.secondaryOrganizerPosition = secondaryOrganizerPosition; }
    public List<String> getSecondaryRoles() { return secondaryRoles; }
    public void setSecondaryRoles(List<String> secondaryRoles) { this.secondaryRoles = secondaryRoles; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public List<FormAnswer> getFormAnswers() { return formAnswers; }
    public void setFormAnswers(List<FormAnswer> formAnswers) { this.formAnswers = formAnswers; }
    public RegistrationStatus getStatus() { return status; }
    public void setStatus(RegistrationStatus status) { this.status = status; }
    public Instant getHoldExpiresAt() { return holdExpiresAt; }
    public void setHoldExpiresAt(Instant holdExpiresAt) { this.holdExpiresAt = holdExpiresAt; }
    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }
}
