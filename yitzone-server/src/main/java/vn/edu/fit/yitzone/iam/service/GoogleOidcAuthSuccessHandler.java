package vn.edu.fit.yitzone.iam.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import vn.edu.fit.yitzone.iam.controller.AuthController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Handles Google Workspace OIDC login success (UC-IAM-02):
 * links/provisions the account, sets the HttpOnly refresh cookie, and redirects to /auth/callback
 * without exposing JWTs in URL query parameters.
 */
@Component
public class GoogleOidcAuthSuccessHandler implements AuthenticationSuccessHandler {
    private final HybridAuthService hybridAuthService;
    private final String frontendBaseUrl;
    private final boolean cookieSecure;

    public GoogleOidcAuthSuccessHandler(
            HybridAuthService hybridAuthService,
            @Value("${yitzone.security.frontend-base-url:http://localhost:5173}") String frontendBaseUrl,
            @Value("${yitzone.security.refresh-cookie-secure:false}") boolean cookieSecure
    ) {
        this.hybridAuthService = hybridAuthService;
        this.frontendBaseUrl = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        this.cookieSecure = cookieSecure;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        if (!(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            response.sendRedirect(frontendBaseUrl + "/auth/callback?error=invalid_oidc_principal");
            return;
        }
        String sub = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String fullName = oidcUser.getFullName();
        boolean emailVerified = Boolean.TRUE.equals(oidcUser.getEmailVerified());
        String hd = oidcUser.getClaimAsString("hd");

        try {
            HybridAuthService.AuthIssueResult issued = hybridAuthService.authenticateGoogleOidc(
                    sub,
                    email,
                    fullName,
                    emailVerified
            );
            if (issued.refreshToken() != null) {
                ResponseCookie cookie = ResponseCookie.from(AuthController.REFRESH_COOKIE_NAME, issued.refreshToken().rawToken())
                        .httpOnly(true)
                        .secure(cookieSecure)
                        .sameSite("Lax")
                        .path("/api/v1/iam/auth")
                        .maxAge(Duration.ofSeconds(issued.refreshToken().ttlSeconds()))
                        .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
            String redirect = frontendBaseUrl + "/auth/callback"
                    + (hd != null && !hd.isBlank() ? "?hd=" + URLEncoder.encode(hd, StandardCharsets.UTF_8) : "");
            response.sendRedirect(redirect);
        } catch (Exception ex) {
            String msg = URLEncoder.encode(ex.getMessage() == null ? "oidc_error" : ex.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendBaseUrl + "/auth/callback?error=oidc_failed&error_description=" + msg);
        }
    }
}
