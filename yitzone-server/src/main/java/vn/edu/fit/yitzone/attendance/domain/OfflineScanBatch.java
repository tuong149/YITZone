package vn.edu.fit.yitzone.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Idempotent batch synchronization for offline BTC barcode/QR scans (UC-ATT-04).
 */
@Document(collection = "OFFLINE_SCAN_BATCHES")
@CompoundIndex(name = "idx_offline_batches_event_uploaded", def = "{'eventId': 1, 'uploadedAt': -1}")
public class OfflineScanBatch {
    @Id
    private String id;

    @Indexed(unique = true)
    private String batchId;

    private String eventId;
    private String sessionId;
    private String scannerUserId;
    private String scannerDeviceId;
    private Instant lastServerSyncAt;
    private long clockOffsetMs;
    private Instant uploadedAt = Instant.now();
    private Instant bundleWipedConfirmedAt;
    private List<OfflineScanItem> scans = new ArrayList<>();

    public enum ScanMethod {
        QR_ECDSA_P256_15S, BARCODE_1D
    }

    public enum ScanType {
        CHECKIN, CHECKOUT
    }

    public enum ResolutionStatus {
        ACCEPTED, PENDING_REVIEW, PENDING_SSO_LINK, DUPLICATE_FLAGGED, INVALID
    }

    public record OfflineScanItem(
            int localSeq,
            ScanMethod scanMethod,
            String userId,
            String studentCode,
            String ticketId,
            ScanType scanType,
            boolean physicalCardVerified,
            Instant deviceScannedAt,
            Instant adjustedScanAt,
            ResolutionStatus resolutionStatus
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getScannerUserId() { return scannerUserId; }
    public void setScannerUserId(String scannerUserId) { this.scannerUserId = scannerUserId; }
    public String getScannerDeviceId() { return scannerDeviceId; }
    public void setScannerDeviceId(String scannerDeviceId) { this.scannerDeviceId = scannerDeviceId; }
    public Instant getLastServerSyncAt() { return lastServerSyncAt; }
    public void setLastServerSyncAt(Instant lastServerSyncAt) { this.lastServerSyncAt = lastServerSyncAt; }
    public long getClockOffsetMs() { return clockOffsetMs; }
    public void setClockOffsetMs(long clockOffsetMs) { this.clockOffsetMs = clockOffsetMs; }
    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
    public Instant getBundleWipedConfirmedAt() { return bundleWipedConfirmedAt; }
    public void setBundleWipedConfirmedAt(Instant bundleWipedConfirmedAt) { this.bundleWipedConfirmedAt = bundleWipedConfirmedAt; }
    public List<OfflineScanItem> getScans() { return scans; }
    public void setScans(List<OfflineScanItem> scans) { this.scans = scans; }
}
