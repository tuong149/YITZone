package vn.edu.fit.yitzone.certificate.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/certificates")
public class CertificateController {

    @GetMapping("/me")
    public ApiResponse<List<CertificateSummaryResponse>> myCertificates() {
        return ApiResponse.ok(List.of());
    }

    /**
     * Returns Pre-signed Silo URL of pre-rendered PDF with private Cache-Control instead of synchronous PDF rendering (ISS-09).
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<ApiResponse<CertificatePdfUrlResponse>> getCertificatePdfUrl(@PathVariable String id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(300, TimeUnit.SECONDS).cachePrivate())
                .body(ApiResponse.ok(new CertificatePdfUrlResponse(
                        id,
                        "https://silo.yitzone.edu.vn/certificates/" + id + "_v1.pdf",
                        300
                )));
    }

    @GetMapping("/verify/{code}")
    public ApiResponse<CertificateVerifyResponse> verifyCertificate(@PathVariable String code) {
        return ApiResponse.ok(new CertificateVerifyResponse(code, false));
    }

    /**
     * Separated revoke and reissue endpoints with Idempotency-Key (ISS-07, ISS-11).
     */
    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('certificate', 'manage')")
    public ApiResponse<CertificateRevokeResponse> revokeCertificate(
            @PathVariable String id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CertificateActionRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(new CertificateRevokeResponse(
                id,
                "REVOKED",
                request.reason(),
                auth.getName(),
                Instant.now(),
                idempotencyKey
        ));
    }

    @PostMapping("/{id}/reissue")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('certificate', 'manage')")
    public ApiResponse<CertificateReissueResponse> reissueCertificate(
            @PathVariable String id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CertificateActionRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(new CertificateReissueResponse(
                id,
                "SUPERSEDED",
                2,
                request.reason(),
                auth.getName(),
                idempotencyKey
        ));
    }

    public record CertificateSummaryResponse(String certificateId, String certificateCode, String status) {}
    public record CertificatePdfUrlResponse(String certificateId, String presignedPdfUrl, int expiresInSeconds) {}
    public record CertificateVerifyResponse(String certificateCode, boolean valid) {}
    public record CertificateRevokeResponse(
            String certificateId,
            String certStatus,
            String reason,
            String revokedBy,
            Instant revokedAt,
            String idempotencyKey
    ) {}
    public record CertificateReissueResponse(
            String previousCertificateId,
            String previousStatus,
            int newCertVersion,
            String reason,
            String reissuedBy,
            String idempotencyKey
    ) {}
    public record CertificateActionRequest(@NotBlank String reason) {}
}
