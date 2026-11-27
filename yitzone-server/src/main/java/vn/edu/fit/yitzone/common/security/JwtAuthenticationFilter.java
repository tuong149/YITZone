package vn.edu.fit.yitzone.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    public static final String JWT_ERROR_ATTRIBUTE = "YITZONE_JWT_ERROR";

    private final JwtTokenService jwtTokenService;
    private final RbacCacheInvalidationService rbacCacheInvalidationService;
    private final EffectivePermissionService effectivePermissionService;

    public JwtAuthenticationFilter(
            JwtTokenService jwtTokenService,
            RbacCacheInvalidationService rbacCacheInvalidationService
    ) {
        this(jwtTokenService, rbacCacheInvalidationService, null);
    }

    @Autowired
    public JwtAuthenticationFilter(
            JwtTokenService jwtTokenService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheInvalidationService,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService
    ) {
        this.jwtTokenService = jwtTokenService;
        this.rbacCacheInvalidationService = rbacCacheInvalidationService;
        this.effectivePermissionService = effectivePermissionService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtTokenService.parseAndValidate(token);
                String userId = claims.getSubject();
                Number permVerNum = claims.get("permVer", Number.class);
                long permVer = permVerNum == null ? 1L : permVerNum.longValue();

                boolean tokenPermVersionValid = rbacCacheInvalidationService == null
                        || rbacCacheInvalidationService.isTokenVersionValid(userId, permVer);

                if (!tokenPermVersionValid && effectivePermissionService == null) {
                    request.setAttribute(JWT_ERROR_ATTRIBUTE, "Phiên quyền hạn (permVer) đã bị thu hồi hoặc cập nhật. Vui lòng làm mới token.");
                    SecurityContextHolder.clearContext();
                } else {
                    @SuppressWarnings("unchecked")
                    List<String> rawAuthorities = claims.get("authorities", List.class);
                    List<SimpleGrantedAuthority> authorities = rawAuthorities == null
                            ? Collections.emptyList()
                            : rawAuthorities.stream().map(SimpleGrantedAuthority::new).toList();

                    @SuppressWarnings("unchecked")
                    List<String> rawScopes = claims.get("scopes", List.class);
                    Set<String> allowedScopes = new HashSet<>();
                    allowedScopes.add("FACULTY");
                    if (rawScopes != null) {
                        allowedScopes.addAll(rawScopes);
                    }
                    ScopeContextHolder.setAllowedScopes(allowedScopes);

                    boolean accountRejected = false;
                    if (effectivePermissionService != null) {
                        try {
                            var computedOpt = effectivePermissionService.resolveForUserId(userId);
                            if (computedOpt.isPresent()) {
                                var computed = computedOpt.get();
                                if (computed.accountArchived()) {
                                    request.setAttribute(JWT_ERROR_ATTRIBUTE, "Tài khoản đã chuyển sang trạng thái lưu trữ");
                                    SecurityContextHolder.clearContext();
                                    accountRejected = true;
                                } else {
                                    ScopeContextHolder.setEffectiveGrants(computed.grants());
                                    if (!tokenPermVersionValid) {
                                        // Stale permVer after grant revocation: keep identity authenticated but
                                        // replace JWT authorities/scopes with freshly computed ones so revoked APIs return 403 (Edge 30).
                                        authorities = computed.authorities().stream()
                                                .map(SimpleGrantedAuthority::new)
                                                .toList();
                                        Set<String> freshScopes = new HashSet<>(computed.allowedScopes());
                                        freshScopes.add("FACULTY");
                                        ScopeContextHolder.setAllowedScopes(freshScopes);
                                    } else {
                                        Set<String> mergedScopes = new HashSet<>(allowedScopes);
                                        mergedScopes.addAll(computed.allowedScopes());
                                        ScopeContextHolder.setAllowedScopes(mergedScopes);
                                    }
                                }
                            } else if (!tokenPermVersionValid) {
                                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Phiên quyền hạn (permVer) đã bị thu hồi hoặc cập nhật. Vui lòng làm mới token.");
                                SecurityContextHolder.clearContext();
                                accountRejected = true;
                            }
                        } catch (Exception ignored) {
                            if (!tokenPermVersionValid) {
                                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Phiên quyền hạn (permVer) đã bị thu hồi hoặc cập nhật. Vui lòng làm mới token.");
                                SecurityContextHolder.clearContext();
                                accountRejected = true;
                            }
                        }
                    }

                    if (!accountRejected) {
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(userId, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (ExpiredJwtException ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Access Token đã hết hạn (JWT Expired)");
                SecurityContextHolder.clearContext();
            } catch (JwtException | IllegalArgumentException ex) {
                request.setAttribute(JWT_ERROR_ATTRIBUTE, "Access Token không hợp lệ");
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
