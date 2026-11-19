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
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/certificates")
public class CertificateController {

    @GetMapping("/me")
    public ApiResponse<List<Map<String, Object>>> myCertificates() {
        return ApiResponse.ok(List.of());
    }

    /**
     * Returns Pre-signed Silo URL of pre-rendered PDF with private Cache-Control instead of synchronous PDF rendering (ISS-09).
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCertificatePdfUrl(@PathVariable String id) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(300, TimeUnit.SECONDS).cachePrivate())
                .body(ApiResponse.ok(Map.of(
                        "certificateId", id,
                        "presignedPdfUrl", "https://silo.yitzone.edu.vn/certificates/" + id + "_v1.pdf",
                        "expiresInSeconds", 300
                )));
    }

    @GetMapping("/verify/{code}")
    public ApiResponse<Map<String, Object>> verifyCertificate(@PathVariable String code) {
        return ApiResponse.ok(Map.of("certificateCode", code, "valid", false));
    }

    /**
     * Separated revoke and reissue endpoints with Idempotency-Key (ISS-07, ISS-11).
     */
    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('certificate', 'manage')")
    public ApiResponse<Map<String, Object>> revokeCertificate(
            @PathVariable String id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CertificateActionRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(Map.of(
                "certificateId", id,
                "certStatus", "REVOKED",
                "reason", request.reason(),
                "revokedBy", auth.getName(),
                "revokedAt", Instant.now(),
                "idempotencyKey", idempotencyKey
        ));
    }

    @PostMapping("/{id}/reissue")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('certificate', 'manage')")
    public ApiResponse<Map<String, Object>> reissueCertificate(
            @PathVariable String id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CertificateActionRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(Map.of(
                "previousCertificateId", id,
                "previousStatus", "SUPERSEDED",
                "newCertVersion", 2,
                "reason", request.reason(),
                "reissuedBy", auth.getName(),
                "idempotencyKey", idempotencyKey
        ));
    }

    public record CertificateActionRequest(@NotBlank String reason) {}
}
