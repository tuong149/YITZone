package vn.edu.fit.yitzone.privacy.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/privacy")
public class PrivacyController {

    @PostMapping("/consents")
    public ApiResponse<ConsentRecordResponse> recordConsent(
            @Valid @RequestBody ConsentRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(new ConsentRecordResponse(
                auth.getName(),
                request.purpose(),
                request.granted(),
                Instant.now()
        ));
    }

    @PostMapping("/my-data-exports")
    public ApiResponse<DataExportRequestResponse> requestPersonalDataExport(Authentication auth) {
        return ApiResponse.ok(new DataExportRequestResponse(
                auth.getName(),
                "PROCESSING",
                Instant.now()
        ));
    }

    public record ConsentRequest(@NotBlank String purpose, boolean granted) {}
    public record ConsentRecordResponse(String userId, String purpose, boolean granted, Instant recordedAt) {}
    public record DataExportRequestResponse(String userId, String status, Instant requestedAt) {}
}
