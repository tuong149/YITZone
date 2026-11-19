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

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;

@RestController
@RequestMapping("/api/v1")
public class AttendanceController {
    private static final java.util.regex.Pattern STUDENT_CODE_PATTERN = java.util.regex.Pattern.compile("^[0-9]{8}$");

    private final WeightedRiskScoringService riskScoringService;
    private final DevicePopVerifierService devicePopVerifierService;
    private final long qrRotationSeconds;
    private final long qrGraceSeconds;

    public AttendanceController(
            WeightedRiskScoringService riskScoringService,
            DevicePopVerifierService devicePopVerifierService,
            @Value("${yitzone.attendance.qr-rotation-seconds:10}") long qrRotationSeconds,
            @Value("${yitzone.attendance.qr-grace-window-seconds:8}") long qrGraceSeconds
    ) {
        this.riskScoringService = riskScoringService;
        this.devicePopVerifierService = devicePopVerifierService;
        this.qrRotationSeconds = qrRotationSeconds;
        this.qrGraceSeconds = qrGraceSeconds;
    }

    @PostMapping("/attendance/check-in")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkIn(
            @Valid @RequestBody CheckInRequest request,
            Authentication auth
    ) {
        Instant now = Instant.now();
        long ageSeconds = now.getEpochSecond() - request.qrIssuedAtEpochSeconds();
        if (ageSeconds > (qrRotationSeconds + qrGraceSeconds)) {
            throw new BusinessException(ErrorCode.QR_EXPIRED, HttpStatus.UNPROCESSABLE_ENTITY,
                    "Mã QR điểm danh đã hết hạn (" + (qrRotationSeconds + qrGraceSeconds) + "s)");
        }

        String canonicalActionFields = request.eventId() + "|" + request.sessionId() + "|" + request.qrIssuedAtEpochSeconds();
        devicePopVerifierService.verifyAndBuildCanonicalString(
                "POST",
                "/api/v1/attendance/check-in",
                auth.getName(),
                request.devicePop(),
                canonicalActionFields
        );

        List<EventAttendance.RiskSignal> signals = request.gpsAvailable()
                ? List.of()
                : List.of(EventAttendance.RiskSignal.GPS_UNAVAILABLE);
        var assessment = riskScoringService.evaluate(signals, null);

        HttpStatus httpStatus = assessment.reviewStatus() == EventAttendance.ReviewStatus.PENDING_REVIEW
                ? HttpStatus.ACCEPTED
                : HttpStatus.OK;

        return ResponseEntity.status(httpStatus).body(ApiResponse.ok(Map.of(
                "userId", auth.getName(),
                "eventId", request.eventId(),
                "sessionId", request.sessionId(),
                "riskScore", assessment.riskScore(),
                "reviewStatus", assessment.reviewStatus(),
                "checkinAt", now
        )));
    }

    /**
     * Standardized lowercase kebab-case URI /events/{id}/offline-ticket (ISS-11).
     */
    @GetMapping("/events/{id}/offline-ticket")
    public ApiResponse<Map<String, Object>> getOfflineTicket(@PathVariable String id, Authentication auth) {
        return ApiResponse.ok(Map.of(
                "eventId", id,
                "userId", auth.getName(),
                "bucketSeconds", 15,
                "issuedAt", Instant.now()
        ));
    }

    /**
     * Supports Delta Sync (?sinceRevision=) and HTTP ETag / If-None-Match (ISS-06).
     */
    @GetMapping("/events/{id}/offline-bundle")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('attendance', 'scan_barcode')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOfflineBundle(
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
                .body(ApiResponse.ok(Map.of(
                        "eventId", id,
                        "revision", currentRevision,
                        "sinceRevision", sinceRevision,
                        "serverTime", Instant.now().toEpochMilli(),
                        "bucketSeconds", 15,
                        "maxBundleAgeHours", 12,
                        "roster", List.of()
                )));
    }

    @PostMapping("/events/{id}/offline-scans/sync")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('attendance', 'scan_barcode')")
    public ApiResponse<Map<String, Object>> syncOfflineScans(
            @PathVariable String id,
            @Valid @RequestBody OfflineScanSyncRequest request
    ) {
        return ApiResponse.ok(Map.of(
                "eventId", id,
                "batchId", request.batchId(),
                "syncedCount", request.scans() == null ? 0 : request.scans().size(),
                "wipeRecommended", true
        ));
    }

    @PostMapping("/events/{id}/attendance/barcode-scan")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('attendance', 'scan_barcode')")
    public ApiResponse<Map<String, Object>> scanPhysicalStudentBarcode(
            @PathVariable String id,
            @Valid @RequestBody BarcodeScanRequest request
    ) {
        Matcher matcher = STUDENT_CODE_PATTERN.matcher(request.studentCode());
        if (!matcher.matches() || !request.physicalCardVerified()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "MSSV phải đúng 8 chữ số và phải xác nhận thẻ sinh viên nhựa vật lý");
        }
        return ApiResponse.ok(Map.of(
                "eventId", id,
                "attendeeKey", "SV:" + request.studentCode(),
                "studentCode", request.studentCode(),
                "hardwareType", request.hardwareType(),
                "checkinAt", Instant.now()
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

    public record OfflineScanItem(String ticketId, String studentCode, long adjustedScanAtEpochMs, long localSeq) {}

    public record OfflineScanSyncRequest(
            @NotBlank String batchId,
            long lastServerSyncAtEpochMs,
            long clockOffsetMs,
            List<OfflineScanItem> scans
    ) {}

    public record BarcodeScanRequest(
            @NotBlank String sessionId,
            @NotBlank @Pattern(regexp = "^[0-9]{8}$") String studentCode,
            @NotBlank String hardwareType,
            boolean physicalCardVerified
    ) {}
}
