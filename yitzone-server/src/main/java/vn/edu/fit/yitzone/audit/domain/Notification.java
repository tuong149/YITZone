package vn.edu.fit.yitzone.audit.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Multi-channel notification record (In-App, Web Push, Email SMTP) with unit scope isolation (UC-SYS-01, UC-IAM-07).
 */
@Document(collection = "NOTIFICATIONS")
@CompoundIndex(name = "idx_notif_recipient_read_created", def = "{'recipientUserId': 1, 'read': 1, 'createdAt': -1}")
public class Notification {
    @Id
    private String id;

    private String recipientUserId;
    private String scopeUnitId;
    private String title;
    private String body;
    private NotificationType type = NotificationType.SYSTEM;
    private String linkUrl;
    private boolean read = false;
    private Instant createdAt = Instant.now();

    public enum NotificationType {
        SYSTEM,
        EVENT_REMINDER,
        ATTENDANCE_CONFIRM,
        ORDER_STATUS,
        DUTY_SWAP,
        BROADCAST
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(String recipientUserId) { this.recipientUserId = recipientUserId; }
    public String getScopeUnitId() { return scopeUnitId; }
    public void setScopeUnitId(String scopeUnitId) { this.scopeUnitId = scopeUnitId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getLinkUrl() { return linkUrl; }
    public void setLinkUrl(String linkUrl) { this.linkUrl = linkUrl; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
