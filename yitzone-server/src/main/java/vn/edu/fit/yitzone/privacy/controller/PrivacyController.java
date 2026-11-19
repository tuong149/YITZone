package vn.edu.fit.yitzone.privacy.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/privacy")
public class PrivacyController {

    @PostMapping("/consents")
    public ApiResponse<Map<String, Object>> recordConsent(
            @Valid @RequestBody ConsentRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(Map.of(
                "userId", auth.getName(),
                "purpose", request.purpose(),
                "granted", request.granted(),
                "recordedAt", Instant.now()
        ));
    }

    @PostMapping("/my-data-exports")
    public ApiResponse<Map<String, Object>> requestPersonalDataExport(Authentication auth) {
        return ApiResponse.ok(Map.of(
                "userId", auth.getName(),
                "status", "PROCESSING",
                "requestedAt", Instant.now()
        ));
    }

    public record ConsentRequest(@NotBlank String purpose, boolean granted) {}
}
