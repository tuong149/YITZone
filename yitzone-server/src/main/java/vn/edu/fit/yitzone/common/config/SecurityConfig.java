package vn.edu.fit.yitzone.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.security.ActiveScopeFilter;
import vn.edu.fit.yitzone.common.security.JwtAuthenticationFilter;
import vn.edu.fit.yitzone.common.security.ScopedPermissionEvaluator;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ActiveScopeFilter activeScopeFilter,
            CorsConfigurationSource corsConfigurationSource,
            AuthenticationEntryPoint authenticationEntryPoint,
            AccessDeniedHandler accessDeniedHandler
    ) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api/v1/iam/auth/**",
                                "/api/v1/store/webhooks/vietqr",
                                "/ws/**"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/events",
                                "/api/v1/events/*",
                                "/api/v1/cms/posts",
                                "/api/v1/cms/posts/*",
                                "/api/v1/certificates/verify/**",
                                "/api/v1/portfolio/verify/**",
                                "/api/v1/voting/campaigns/*/verify-receipt",
                                "/api/v1/pwa/vapid-public-key"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(activeScopeFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint problemAuthenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, authException) -> {
            Object jwtError = request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE);
            String detail = jwtError != null
                    ? jwtError.toString()
                    : "Yêu cầu xác thực Bearer Access Token hợp lệ để truy cập tài nguyên này";
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            ApiResponse<Void> problem = ApiResponse.problem(
                    ErrorCode.UNAUTHORIZED,
                    HttpStatus.UNAUTHORIZED.value(),
                    "Chưa xác thực hoặc phiên đăng nhập đã hết hạn",
                    detail,
                    request.getRequestURI(),
                    null
            );
            objectMapper.writeValue(response.getWriter(), problem);
        };
    }

    @Bean
    public AccessDeniedHandler problemAccessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            ApiResponse<Void> problem = ApiResponse.problem(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN.value(),
                    "Truy cập bị từ chối",
                    "Không đủ quyền hạn để thực hiện thao tác này",
                    request.getRequestURI(),
                    null
            );
            objectMapper.writeValue(response.getWriter(), problem);
        };
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(ScopedPermissionEvaluator evaluator) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(evaluator);
        return handler;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${yitzone.security.cors-allowed-origins}") List<String> allowedOrigins
    ) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
