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

    public JwtAuthenticationFilter(
            JwtTokenService jwtTokenService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheInvalidationService
    ) {
        this.jwtTokenService = jwtTokenService;
        this.rbacCacheInvalidationService = rbacCacheInvalidationService;
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

                if (rbacCacheInvalidationService != null && !rbacCacheInvalidationService.isTokenVersionValid(userId, permVer)) {
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

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
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
