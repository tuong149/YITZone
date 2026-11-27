package vn.edu.fit.yitzone.privacy.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.privacy.domain.ConsentRecord;
import vn.edu.fit.yitzone.privacy.domain.DataPrivacyRequest;
import vn.edu.fit.yitzone.privacy.service.PrivacyService;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/privacy")
public class PrivacyController {
    private final PrivacyService privacyService;

    public PrivacyController(@Autowired(required = false) PrivacyService privacyService) {
        this.privacyService = privacyService;
    }

    @GetMapping("/consents/me")
    public ApiResponse<List<ConsentRecord>> listMyConsents(Authentication auth) {
        if (privacyService == null) {
            return ApiResponse.ok(List.of());
        }
        return ApiResponse.ok(privacyService.listMyConsents(auth.getName()));
    }

    @PostMapping("/consents")
    public ApiResponse<ConsentRecordResponse> recordConsent(
            @Valid @RequestBody ConsentRequest request,
            Authentication auth
    ) {
        if (privacyService == null) {
            return ApiResponse.ok(new ConsentRecordResponse(
                    auth.getName(),
                    request.purpose(),
                    request.granted(),
                    Instant.now()
            ));
        }
        ConsentRecord saved = privacyService.recordConsent(
                auth.getName(),
                request.purpose(),
                request.policyVersion(),
                request.granted()
        );
        return ApiResponse.ok(new ConsentRecordResponse(
                saved.getUserId(),
                saved.getConsentType().name(),
                saved.isGranted(),
                saved.isGranted() ? saved.getGrantedAt() : saved.getRevokedAt()
        ));
    }

    @GetMapping("/my-data")
    public ApiResponse<Map<String, Object>> getMyPersonalData(Authentication auth) {
        return ApiResponse.ok(privacyService.buildPersonalDataSnapshot(auth.getName()));
    }

    @PostMapping("/my-data-exports")
    public ApiResponse<DataExportRequestResponse> requestPersonalDataExport(
            @RequestParam(defaultValue = "JSON") String format,
            Authentication auth
    ) {
        if (privacyService == null) {
            return ApiResponse.ok(new DataExportRequestResponse(
                    null,
                    auth.getName(),
                    format,
                    "PROCESSING",
                    Instant.now()
            ));
        }
        PrivacyService.ExportedDataFile exported = privacyService.exportPersonalData(auth.getName(), format);
        return ApiResponse.ok(new DataExportRequestResponse(
                exported.requestId(),
                auth.getName(),
                exported.format(),
                "COMPLETED",
                Instant.now()
        ));
    }

    @GetMapping("/my-data-exports/download")
    public ResponseEntity<byte[]> downloadPersonalDataExport(
            @RequestParam(defaultValue = "JSON") String format,
            Authentication auth
    ) {
        PrivacyService.ExportedDataFile exported = privacyService.exportPersonalData(auth.getName(), format);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(exported.contentType()));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(exported.filename(), StandardCharsets.UTF_8)
                .build());
        return ResponseEntity.ok().headers(headers).body(exported.content());
    }

    @PostMapping("/requests")
    public ApiResponse<DataPrivacyRequest> createPrivacyRequest(
            @Valid @RequestBody CreatePrivacyRequestBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(privacyService.createPrivacyRequest(
                auth.getName(),
                body.requestType(),
                body.reason()
        ));
    }

    @GetMapping("/requests/me")
    public ApiResponse<List<DataPrivacyRequest>> listMyRequests(Authentication auth) {
        return ApiResponse.ok(privacyService.listMyRequests(auth.getName()));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('privacy', 'process_request')")
    public ApiResponse<List<DataPrivacyRequest>> listAllRequests(
            @RequestParam(required = false) DataPrivacyRequest.RequestStatus status
    ) {
        return ApiResponse.ok(privacyService.listAllRequests(status));
    }

    @PostMapping("/requests/{id}/process")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('privacy', 'process_request')")
    public ApiResponse<DataPrivacyRequest> processRequest(
            @PathVariable String id,
            @RequestBody ProcessPrivacyRequestBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(privacyService.processRequest(
                id,
                body.approved(),
                body.handlingNote(),
                auth.getName()
        ));
    }

    public record ConsentRequest(
            @NotBlank String purpose,
            boolean granted,
            String policyVersion
    ) {
    }

    public record ConsentRecordResponse(
            String userId,
            String purpose,
            boolean granted,
            Instant recordedAt
    ) {
    }

    public record DataExportRequestResponse(
            String requestId,
            String userId,
            String format,
            String status,
            Instant requestedAt
    ) {
    }

    public record CreatePrivacyRequestBody(
            @NotNull DataPrivacyRequest.RequestType requestType,
            String reason
    ) {
    }

    public record ProcessPrivacyRequestBody(
            boolean approved,
            String handlingNote
    ) {
    }
}
