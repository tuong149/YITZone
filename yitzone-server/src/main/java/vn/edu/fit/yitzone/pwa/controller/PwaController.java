package vn.edu.fit.yitzone.pwa.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pwa")
public class PwaController {
    private static final List<String> ALLOWED_PUSH_HOST_SUFFIXES = List.of(
            "fcm.googleapis.com",
            ".push.apple.com",
            "updates.push.services.mozilla.com",
            ".notify.windows.com"
    );

    @GetMapping("/vapid-public-key")
    public ApiResponse<VapidKeyResponse> getVapidPublicKey() {
        return ApiResponse.ok(new VapidKeyResponse(""));
    }

    /**
     * Strict Domain Allowlist + HTTPS-only check prevents Blind SSRF via Web Push endpoint (ISS-04).
     */
    @PostMapping("/push-subscriptions")
    public ApiResponse<PushSubscriptionResponse> subscribeWebPush(
            @Valid @RequestBody PushSubscriptionRequest request,
            Authentication auth
    ) {
        validatePushEndpointAgainstSsrf(request.endpoint());
        return ApiResponse.ok(new PushSubscriptionResponse(
                auth.getName(),
                request.endpoint(),
                true
        ));
    }

    public static void validatePushEndpointAgainstSsrf(String rawEndpoint) {
        URI uri;
        try {
            uri = URI.create(rawEndpoint);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.SSRF_ENDPOINT_REJECTED, HttpStatus.BAD_REQUEST,
                    "URL Web Push Endpoint không hợp lệ");
        }
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(scheme) || host == null || host.isBlank()) {
            throw new BusinessException(ErrorCode.SSRF_ENDPOINT_REJECTED, HttpStatus.BAD_REQUEST,
                    "Web Push Endpoint bắt buộc sử dụng giao thức HTTPS");
        }
        String lowerHost = host.toLowerCase(Locale.ROOT);
        boolean allowed = ALLOWED_PUSH_HOST_SUFFIXES.stream().anyMatch(suffix ->
                suffix.startsWith(".") ? lowerHost.endsWith(suffix) : lowerHost.equals(suffix)
        );
        if (!allowed) {
            throw new BusinessException(ErrorCode.SSRF_ENDPOINT_REJECTED, HttpStatus.BAD_REQUEST,
                    "Domain Web Push không nằm trong danh sách trắng (FCM / APNs / Mozilla / WNS)");
        }
    }

    public record PushSubscriptionRequest(
            @NotBlank String endpoint,
            @NotEmpty Map<String, String> keys,
            String deviceName
    ) {}

    public record VapidKeyResponse(String publicKey) {}

    public record PushSubscriptionResponse(String userId, String endpoint, boolean active) {}
}
