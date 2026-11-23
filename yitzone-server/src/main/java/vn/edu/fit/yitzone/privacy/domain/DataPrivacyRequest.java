package vn.edu.fit.yitzone.privacy.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * User personal data export, rectification, or erasure/anonymization request (UC-IAM-11, NFR-PRIV-04).
 */
@Document(collection = "DATA_PRIVACY_REQUESTS")
@CompoundIndex(name = "idx_privacy_req_user_status", def = "{'userId': 1, 'status': 1, 'requestedAt': -1}")
public class DataPrivacyRequest {
    @Id
    private String id;

    private String userId;
    private RequestType requestType;
    private String exportFormat; // JSON | PDF
    private String reason;
    private RequestStatus status = RequestStatus.PENDING;
    private String exportDownloadUrl;
    private Instant exportExpiresAt;
    private String handledBy;
    private Instant handledAt;
    private String handlingNote;
    private Instant requestedAt = Instant.now();

    public enum RequestType {
        DATA_EXPORT,
        RECTIFICATION,
        ERASURE_ANONYMIZE
    }

    public enum RequestStatus {
        PENDING, PROCESSING, COMPLETED, REJECTED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public RequestType getRequestType() { return requestType; }
    public void setRequestType(RequestType requestType) { this.requestType = requestType; }
    public String getExportFormat() { return exportFormat; }
    public void setExportFormat(String exportFormat) { this.exportFormat = exportFormat; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public String getExportDownloadUrl() { return exportDownloadUrl; }
    public void setExportDownloadUrl(String exportDownloadUrl) { this.exportDownloadUrl = exportDownloadUrl; }
    public Instant getExportExpiresAt() { return exportExpiresAt; }
    public void setExportExpiresAt(Instant exportExpiresAt) { this.exportExpiresAt = exportExpiresAt; }
    public String getHandledBy() { return handledBy; }
    public void setHandledBy(String handledBy) { this.handledBy = handledBy; }
    public Instant getHandledAt() { return handledAt; }
    public void setHandledAt(Instant handledAt) { this.handledAt = handledAt; }
    public String getHandlingNote() { return handlingNote; }
    public void setHandlingNote(String handlingNote) { this.handlingNote = handlingNote; }
    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
}
