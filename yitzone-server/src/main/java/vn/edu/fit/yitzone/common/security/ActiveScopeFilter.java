package vn.edu.fit.yitzone.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Extracts X-Active-Scope-Id header for multi-role context switching (LLD 2.3.6).
 */
@Component
public class ActiveScopeFilter extends OncePerRequestFilter {
    public static final String ACTIVE_SCOPE_HEADER = "X-Active-Scope-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String activeScopeId = request.getHeader(ACTIVE_SCOPE_HEADER);
            if (activeScopeId != null && !activeScopeId.isBlank()) {
                ScopeContextHolder.setActiveScopeId(activeScopeId.trim());
            }
            filterChain.doFilter(request, response);
        } finally {
            ScopeContextHolder.clear();
        }
    }
}
