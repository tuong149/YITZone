package vn.edu.fit.yitzone.pwa.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Browser Web Push VAPID subscription and per-category user notification preferences (UC-PWA-01).
 */
@Document(collection = "PUSH_SUBSCRIPTIONS")
@CompoundIndex(name = "idx_push_sub_user_active", def = "{'userId': 1, 'active': 1}")
public class PushSubscription {
    @Id
    private String id;

    private String userId;

    @Indexed(unique = true)
    private String endpoint;

    private SubscriptionKeys keys;
    private String deviceName;
    private NotificationPreferences notificationPreferences = new NotificationPreferences(true, true, true, true, true);
    private boolean active = true;
    private Instant createdAt = Instant.now();
    private Instant lastNotifiedAt;

    public record SubscriptionKeys(
            String p256dh,
            String auth
    ) {
    }

    public record NotificationPreferences(
            boolean dutyReminder,
            boolean eventReminder,
            boolean waitlistAlert,
            boolean storeOrderUpdate,
            boolean unitBroadcast
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public SubscriptionKeys getKeys() { return keys; }
    public void setKeys(SubscriptionKeys keys) { this.keys = keys; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    public NotificationPreferences getNotificationPreferences() { return notificationPreferences; }
    public void setNotificationPreferences(NotificationPreferences notificationPreferences) { this.notificationPreferences = notificationPreferences; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getLastNotifiedAt() { return lastNotifiedAt; }
    public void setLastNotifiedAt(Instant lastNotifiedAt) { this.lastNotifiedAt = lastNotifiedAt; }
}
