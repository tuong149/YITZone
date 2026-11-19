package vn.edu.fit.yitzone.attendance.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance;
import vn.edu.fit.yitzone.attendance.service.WeightedRiskScoringService;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.DevicePopProof;
import vn.edu.fit.yitzone.common.security.DevicePopVerifierService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Matcher;

@RestController
@RequestMapping("/api/v1")
public class AttendanceController {
    private static final java.util.regex.Pattern STUDENT_CODE_PATTERN = java.util.regex.Pattern.compile("^[0-9]{8}$");

    private final WeightedRiskScoringService riskScoringService;
    private final DevicePopVerifierService devicePopVerifierService;
    private final long qrRotationSeconds;
    private final long qrGraceSeconds;
    private final String qrSigningSecret;

    public AttendanceController(
            WeightedRiskScoringService riskScoringService,
            DevicePopVerifierService devicePopVerifierService,
            @Value("${yitzone.attendance.qr-rotation-seconds:10}") long qrRotationSeconds,
            @Value("${yitzone.attendance.qr-grace-window-seconds:8}") long qrGraceSeconds,
            @Value("${yitzone.security.jwt-secret}") String qrSigningSecret
    ) {
        this.riskScoringService = riskScoringService;
        this.devicePopVerifierService = devicePopVerifierService;
        this.qrRotationSeconds = qrRotationSeconds;
        this.qrGraceSeconds = qrGraceSeconds;
        this.qrSigningSecret = qrSigningSecret;
    }

    public String issueSignedQrPayload(String eventId, String sessionId, long issuedAtEpochSeconds) {
        String data = eventId + "|" + sessionId + "|" + issuedAtEpochSeconds;
        String sig = computeQrHmacHex(data, qrSigningSecret);
        return data + "|" + sig;
    }

    public static String computeQrHmacHex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Cannot compute QR HMAC-SHA256", e);
        }
    }

    private long parseAndVerifySignedQrPayload(String signedQrPayload, String expectedEventId, String expectedSessionId) {
        String[] parts = signedQrPayload == null ? new String[0] : signedQrPayload.split("\\|");
        if (parts.length != 4) {
            throw new BusinessException(ErrorCode.INVALID_QR_SIGNATURE, HttpStatus.UNPROCESSABLE_ENTITY,
                    "Định dạng signedQrPayload không hợp lệ (yêu cầu eventId|sessionId|issuedAtEpochSeconds|signature)");
        }
        String qrEventId = parts[0];
        String qrSessionId = parts[1];
        long issuedAtEpochSec;
        try {
            issuedAtEpochSec = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.INVALID_QR_SIGNATURE, HttpStatus.UNPROCESSABLE_ENTITY,
                    "Mốc thời gian phát hành trong signedQrPayload không hợp lệ");
        }
        String providedSig = parts[3];
        if (!qrEventId.equals(expectedEventId) || !qrSessionId.equals(expectedSessionId)) {
            throw new BusinessException(ErrorCode.INVALID_QR_SIGNATURE, HttpStatus.UNPROCESSABLE_ENTITY,
                    "signedQrPayload không khớp với eventId hoặc sessionId được yêu cầu");
        }
        String expectedSig = computeQrHmacHex(qrEventId + "|" + qrSessionId + "|" + issuedAtEpochSec, qrSigningSecret);
        boolean valid = MessageDigest.isEqual(
                expectedSig.getBytes(StandardCharsets.UTF_8),
                providedSig.toLowerCase().getBytes(StandardCharsets.UTF_8)
        );
        if (!valid) {
            throw new BusinessException(ErrorCode.INVALID_QR_SIGNATURE, HttpStatus.UNPROCESSABLE_ENTITY,
                    "Chữ ký Server trên mã QR điểm danh không hợp lệ hoặc đã bị giả mạo");
        }
        return issuedAtEpochSec;
    }

    @PostMapping("/attendance/check-in")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request,
            Authentication auth
    ) {
        Instant serverReceivedAt = Instant.now();
        long verifiedIssuedAtEpochSeconds = parseAndVerifySignedQrPayload(
                request.signedQrPayload(),
                request.eventId(),
                request.sessionId()
        );

        long ageSeconds = serverReceivedAt.getEpochSecond() - verifiedIssuedAtEpochSeconds;
        long maxAllowedAge = qrRotationSeconds + qrGraceSeconds;
        if (ageSeconds < -2 || ageSeconds > maxAllowedAge) {
            throw new BusinessException(ErrorCode.QR_EXPIRED, HttpStatus.UNPROCESSABLE_ENTITY,
                    "Mã QR điểm danh đã hết hạn so với thời điểm máy chủ nhận (" + maxAllowedAge + "s)");
        }

        String canonicalActionFields = request.eventId() + "|" + request.sessionId() + "|" + verifiedIssuedAtEpochSeconds;
        devicePopVerifierService.verifyDevicePop(
                "POST",
                "/api/v1/attendance/check-in",
                auth.getName(),
                request.devicePop(),
                canonicalActionFields
        );

        List<EventAttendance.RiskSignal> signals = new ArrayList<>();
        if (!request.gpsAvailable() || request.lat() == null || request.lng() == null) {
            signals.add(EventAttendance.RiskSignal.GPS_UNAVAILABLE);
        } else if (request.accuracy() != null && request.accuracy() > 150.0) {
            signals.add(EventAttendance.RiskSignal.GPS_MODERATE_DRIFT);
        }
        var assessment = riskScoringService.evaluate(signals, null);

        HttpStatus httpStatus = assessment.reviewStatus() == EventAttendance.ReviewStatus.PENDING_REVIEW
                ? HttpStatus.ACCEPTED
                : HttpStatus.OK;

        return ResponseEntity.status(httpStatus).body(ApiResponse.ok(new CheckInResponse(
                auth.getName(),
                request.eventId(),
                request.sessionId(),
                assessment.riskScore(),
                assessment.reviewStatus(),
                serverReceivedAt
        )));
    }

    /**
     * Standardized lowercase kebab-case URI /events/{id}/offline-ticket (ISS-11).
     */
    @GetMapping("/events/{id}/offline-ticket")
    public ApiResponse<OfflineTicketResponse> getOfflineTicket(@PathVariable String id, Authentication auth) {
        return ApiResponse.ok(new OfflineTicketResponse(
                id,
                auth.getName(),
                15,
                Instant.now()
        ));
    }

    /**
     * Supports Delta Sync (?sinceRevision=) and HTTP ETag / If-None-Match (ISS-06).
     */
    @GetMapping("/events/{id}/offline-bundle")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('attendance', 'scan_barcode')")
    public ResponseEntity<ApiResponse<OfflineBundleResponse>> getOfflineBundle(
            @PathVariable String id,
            @RequestParam(value = "sinceRevision", defaultValue = "0") long sinceRevision,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch
    ) {
        long currentRevision = 1L;
        String etag = "\"evt-" + id + "-rev-" + currentRevision + "\"";
        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }
        return ResponseEntity.ok()
                .eTag(etag)
                .body(ApiResponse.ok(new OfflineBundleResponse(
                        id,
                        currentRevision,
                        sinceRevision,
                        Instant.now().toEpochMilli(),
                        15,
                        12,
                        List.of()
                )));
    }

    @PostMapping("/events/{id}/offline-scans/sync")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('attendance', 'scan_barcode')")
    public ApiResponse<OfflineScanSyncResponse> syncOfflineScans(
            @PathVariable String id,
            @Valid @RequestBody OfflineScanSyncRequest request
    ) {
        return ApiResponse.ok(new OfflineScanSyncResponse(
                id,
                request.batchId(),
                request.scans() == null ? 0 : request.scans().size(),
                true
        ));
    }

    @PostMapping("/events/{id}/attendance/barcode-scan")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('attendance', 'scan_barcode')")
    public ApiResponse<BarcodeScanResponse> scanPhysicalStudentBarcode(
            @PathVariable String id,
            @Valid @RequestBody BarcodeScanRequest request
    ) {
        Matcher matcher = STUDENT_CODE_PATTERN.matcher(request.studentCode());
        if (!matcher.matches() || !request.physicalCardVerified()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "MSSV phải đúng 8 chữ số và phải xác nhận thẻ sinh viên nhựa vật lý");
        }
        return ApiResponse.ok(new BarcodeScanResponse(
                id,
                "SV:" + request.studentCode(),
                request.studentCode(),
                request.hardwareType(),
                Instant.now()
        ));
    }

    public record CheckInRequest(
            @NotBlank String eventId,
            @NotBlank String sessionId,
            @NotBlank String signedQrPayload,
            long qrIssuedAtEpochSeconds,
            @NotNull @Valid DevicePopProof devicePop,
            Double lat,
            Double lng,
            Double accuracy,
            boolean gpsAvailable
    ) {}

    public record CheckInResponse(
            String userId,
            String eventId,
            String sessionId,
            int riskScore,
            EventAttendance.ReviewStatus reviewStatus,
            Instant checkinAt
    ) {}

    public record OfflineTicketResponse(
            String eventId,
            String userId,
            int bucketSeconds,
            Instant issuedAt
    ) {}

    public record OfflineBundleResponse(
            String eventId,
            long revision,
            long sinceRevision,
            long serverTime,
            int bucketSeconds,
            int maxBundleAgeHours,
            List<Object> roster
    ) {}

    public record OfflineScanItem(String ticketId, String studentCode, long adjustedScanAtEpochMs, long localSeq) {}

    public record OfflineScanSyncRequest(
            @NotBlank String batchId,
            long lastServerSyncAtEpochMs,
            long clockOffsetMs,
            List<OfflineScanItem> scans
    ) {}

    public record OfflineScanSyncResponse(
            String eventId,
            String batchId,
            int syncedCount,
            boolean wipeRecommended
    ) {}

    public record BarcodeScanRequest(
            @NotBlank String sessionId,
            @NotBlank @Pattern(regexp = "^[0-9]{8}$") String studentCode,
            @NotBlank String hardwareType,
            boolean physicalCardVerified
    ) {}

    public record BarcodeScanResponse(
            String eventId,
            String attendeeKey,
            String studentCode,
            String hardwareType,
            Instant checkinAt
    ) {}
}
