package vn.edu.fit.yitzone.iam.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.service.HybridAuthService;

import java.time.Duration;

/**
 * Unified Hybrid Authentication controller (UC-IAM-01, UC-IAM-02, UC-IAM-03).
 */
@RestController
@RequestMapping("/api/v1/iam/auth")
public class AuthController {
    public static final String REFRESH_COOKIE_NAME = "yitz_rt";

    private final HybridAuthService hybridAuthService;
    private final boolean cookieSecure;

    public AuthController(
            HybridAuthService hybridAuthService,
            @Value("${yitzone.security.refresh-cookie-secure:false}") boolean cookieSecure
    ) {
        this.hybridAuthService = hybridAuthService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/register")
    public ApiResponse<HybridAuthService.RegisterResult> register(@Valid @RequestBody RegisterRequest req) {
        return ApiResponse.ok(hybridAuthService.registerWithEmail(
                req.fullName(),
                req.email(),
                req.password(),
                req.consentAccepted()
        ));
    }

    @PostMapping("/verify-email-otp")
    public ApiResponse<HybridAuthService.AuthSessionPayload> verifyEmailOtp(
            @Valid @RequestBody VerifyOtpRequest req,
            HttpServletResponse response
    ) {
        HybridAuthService.AuthIssueResult issued = hybridAuthService.verifyRegistrationOtp(req.email(), req.otpCode());
        attachRefreshCookie(response, issued);
        return ApiResponse.ok(issued.payload());
    }

    @PostMapping("/resend-otp")
    public ApiResponse<HybridAuthService.RegisterResult> resendOtp(@Valid @RequestBody EmailOnlyRequest req) {
        return ApiResponse.ok(hybridAuthService.resendRegistrationOtp(req.email()));
    }

    @PostMapping("/login")
    public ApiResponse<HybridAuthService.AuthSessionPayload> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletResponse response
    ) {
        HybridAuthService.AuthIssueResult issued = hybridAuthService.loginWithPassword(req.email(), req.password());
        attachRefreshCookie(response, issued);
        return ApiResponse.ok(issued.payload());
    }

    @PostMapping("/mfa/setup")
    public ApiResponse<HybridAuthService.MfaSetupResult> setupMfa(Authentication auth) {
        requireAuthenticated(auth);
        return ApiResponse.ok(hybridAuthService.setupTotpMfa(auth.getName()));
    }

    @PostMapping("/mfa/verify")
    public ApiResponse<Object> verifyMfa(
            @Valid @RequestBody VerifyMfaRequest req,
            Authentication auth,
            HttpServletResponse response
    ) {
        if (req.mfaChallengeToken() != null && !req.mfaChallengeToken().isBlank()) {
            HybridAuthService.AuthIssueResult issued = hybridAuthService.verifyMfaLoginChallenge(
                    req.mfaChallengeToken(),
                    req.code()
            );
            attachRefreshCookie(response, issued);
            return ApiResponse.ok(issued.payload());
        }
        requireAuthenticated(auth);
        hybridAuthService.enableTotpMfa(auth.getName(), req.code());
        return ApiResponse.ok(new StatusResponse("MFA_ENABLED"));
    }

    @PostMapping("/mfa/disable")
    public ApiResponse<StatusResponse> disableMfa(Authentication auth) {
        requireAuthenticated(auth);
        hybridAuthService.disableTotpMfa(auth.getName());
        return ApiResponse.ok(new StatusResponse("MFA_DISABLED"));
    }

    @PostMapping("/password/forgot")
    public ApiResponse<StatusResponse> forgotPassword(@Valid @RequestBody EmailOnlyRequest req) {
        hybridAuthService.requestPasswordReset(req.email());
        return ApiResponse.ok(new StatusResponse("IF_EMAIL_EXISTS_OTP_SENT"));
    }

    @PostMapping("/password/reset")
    public ApiResponse<StatusResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        hybridAuthService.completePasswordReset(req.email(), req.otpCode(), req.newPassword());
        return ApiResponse.ok(new StatusResponse("PASSWORD_RESET"));
    }

    @PostMapping("/password/change")
    public ApiResponse<StatusResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest req,
            Authentication auth,
            HttpServletResponse response
    ) {
        requireAuthenticated(auth);
        hybridAuthService.changeOrSetupPassword(auth.getName(), req.currentPassword(), req.newPassword());
        clearRefreshCookie(response);
        return ApiResponse.ok(new StatusResponse("PASSWORD_UPDATED"));
    }

    @PostMapping("/password/setup")
    public ApiResponse<StatusResponse> setupPassword(
            @Valid @RequestBody SetupPasswordRequest req,
            Authentication auth
    ) {
        requireAuthenticated(auth);
        hybridAuthService.changeOrSetupPassword(auth.getName(), null, req.newPassword());
        return ApiResponse.ok(new StatusResponse("PASSWORD_SETUP"));
    }

    @PostMapping("/refresh")
    public ApiResponse<HybridAuthService.AuthSessionPayload> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefreshToken = extractRefreshCookie(request);
        HybridAuthService.AuthIssueResult issued = hybridAuthService.refreshSession(rawRefreshToken);
        attachRefreshCookie(response, issued);
        return ApiResponse.ok(issued.payload());
    }

    @PostMapping("/logout")
    public ApiResponse<StatusResponse> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefreshToken = extractRefreshCookie(request);
        hybridAuthService.logout(rawRefreshToken);
        clearRefreshCookie(response);
        return ApiResponse.ok(new StatusResponse("LOGGED_OUT"));
    }

    private void attachRefreshCookie(HttpServletResponse response, HybridAuthService.AuthIssueResult issued) {
        if (issued == null || issued.refreshToken() == null) {
            return;
        }
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, issued.refreshToken().rawToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/v1/iam/auth")
                .maxAge(Duration.ofSeconds(issued.refreshToken().ttlSeconds()))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/api/v1/iam/auth")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie c : cookies) {
            if (REFRESH_COOKIE_NAME.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }

    private void requireAuthenticated(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Yêu cầu đăng nhập để thực hiện thao tác này");
        }
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank String password,
            boolean consentAccepted
    ) {
    }

    public record VerifyOtpRequest(
            @NotBlank @Email String email,
            @NotBlank String otpCode
    ) {
    }

    public record EmailOnlyRequest(@NotBlank @Email String email) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    public record VerifyMfaRequest(
            String mfaChallengeToken,
            @NotBlank String code
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Email String email,
            @NotBlank String otpCode,
            @NotBlank String newPassword
    ) {
    }

    public record ChangePasswordRequest(
            String currentPassword,
            @NotBlank String newPassword
    ) {
    }

    public record SetupPasswordRequest(@NotBlank String newPassword) {
    }

    public record StatusResponse(String status) {
    }
}
