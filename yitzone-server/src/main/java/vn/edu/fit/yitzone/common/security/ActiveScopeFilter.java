package vn.edu.fit.yitzone.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 * Extracts and validates X-Active-Scope-Id header against the authenticated
 * user's allowed roleScopes (LLD 2.3.6).
 */
@Component
public class ActiveScopeFilter extends OncePerRequestFilter {
    public static final String ACTIVE_SCOPE_HEADER = "X-Active-Scope-Id";

    private final ObjectMapper objectMapper;
    private final RbacCacheInvalidationService rbacCacheService;

    public ActiveScopeFilter(
            ObjectMapper objectMapper,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService) {
        this.objectMapper = objectMapper;
        this.rbacCacheService = rbacCacheService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String headerValue = request.getHeader(ACTIVE_SCOPE_HEADER);
            if (headerValue != null && !headerValue.isBlank()) {
                String requestedScope = headerValue.trim();
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                    if (!isScopeAllowedForUser(auth, requestedScope)) {
                        response.setStatus(HttpStatus.FORBIDDEN.value());
                        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                        response.setCharacterEncoding("UTF-8");
                        ApiResponse<Void> problem = ApiResponse.problem(
                                ErrorCode.FORBIDDEN,
                                HttpStatus.FORBIDDEN.value(),
                                "Ngữ cảnh đơn vị (X-Active-Scope-Id) không hợp lệ",
                                "Tài khoản không thuộc đơn vị hoặc phạm vi '" + requestedScope + "'",
                                request.getRequestURI(),
                                null);
                        objectMapper.writeValue(response.getWriter(), problem);
                        return;
                    }
                    ScopeContextHolder.setActiveScopeId(requestedScope);
                } else {
                    // Unauthenticated users can only operate in public FACULTY scope
                    if (!"FACULTY".equalsIgnoreCase(requestedScope)) {
                        response.setStatus(HttpStatus.FORBIDDEN.value());
                        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                        response.setCharacterEncoding("UTF-8");
                        ApiResponse<Void> problem = ApiResponse.problem(
                                ErrorCode.FORBIDDEN,
                                HttpStatus.FORBIDDEN.value(),
                                "Ngữ cảnh đơn vị yêu cầu xác thực",
                                "Người dùng chưa đăng nhập không được phép chuyển sang ngữ cảnh nội bộ '"
                                        + requestedScope + "'",
                                request.getRequestURI(),
                                null);
                        objectMapper.writeValue(response.getWriter(), problem);
                        return;
                    }
                    ScopeContextHolder.setActiveScopeId("FACULTY");
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            ScopeContextHolder.clear();
        }
    }

    private boolean isScopeAllowedForUser(Authentication auth, String requestedScope) {
        if ("FACULTY".equalsIgnoreCase(requestedScope)) {
            return true;
        }
        boolean isStandingCommittee = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STANDING_COMMITTEE".equals(a.getAuthority())
                        || "ROLE_SYSTEM_ADMIN".equals(a.getAuthority())
                        || ("SCOPE_" + requestedScope).equals(a.getAuthority()));
        if (isStandingCommittee) {
            return true;
        }
        Set<String> allowed = new HashSet<>(ScopeContextHolder.getAllowedScopes());
        if (rbacCacheService != null) {
            Set<String> cachedScopes = rbacCacheService.getLocalUserScopes(auth.getName());
            if (cachedScopes != null) {
                allowed.addAll(cachedScopes);
            }
        }
        return allowed.contains(requestedScope);
    }
}
