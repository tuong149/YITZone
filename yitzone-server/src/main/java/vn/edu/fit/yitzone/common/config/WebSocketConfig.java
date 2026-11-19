package vn.edu.fit.yitzone.common.config;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import vn.edu.fit.yitzone.common.security.JwtTokenService;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private static final Set<String> ADMIN_CHANNEL_AUTHORITIES = Set.of(
            "voting:host",
            "liveqa:moderate",
            "ROLE_STANDING_COMMITTEE",
            "ROLE_SYSTEM_ADMIN"
    );

    private final JwtTokenService jwtTokenService;
    private final List<String> allowedOrigins;

    @Autowired
    public WebSocketConfig(
            @Autowired(required = false) JwtTokenService jwtTokenService,
            @Value("${yitzone.security.cors-allowed-origins:http://localhost:5173,http://localhost}") List<String> allowedOrigins
    ) {
        this.jwtTokenService = jwtTokenService;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.toArray(new String[0]);
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins)
                .withSockJS();
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new StompChannelInterceptor(jwtTokenService));
    }

    /**
     * Authenticates STOMP CONNECT frames via Bearer JWT and guards administrative channels (ending with ".admin") per HLD 5.2 & LLD 2.3 (A24b).
     */
    public static class StompChannelInterceptor implements ChannelInterceptor {
        private final JwtTokenService jwtTokenService;

        public StompChannelInterceptor() {
            this(null);
        }

        public StompChannelInterceptor(JwtTokenService jwtTokenService) {
            this.jwtTokenService = jwtTokenService;
        }

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor == null) {
                return message;
            }

            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
                if (authHeader != null && authHeader.startsWith("Bearer ") && jwtTokenService != null) {
                    String token = authHeader.substring(7);
                    try {
                        Claims claims = jwtTokenService.parseAndValidate(token);
                        String userId = claims.getSubject();
                        @SuppressWarnings("unchecked")
                        List<String> rawAuthorities = claims.get("authorities", List.class);
                        List<SimpleGrantedAuthority> authorities = rawAuthorities == null
                                ? Collections.emptyList()
                                : rawAuthorities.stream().map(SimpleGrantedAuthority::new).toList();
                        accessor.setUser(new UsernamePasswordAuthenticationToken(userId, null, authorities));
                    } catch (Exception e) {
                        throw new AccessDeniedException("STOMP CONNECT Bearer token không hợp lệ hoặc đã hết hạn");
                    }
                }
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && destination.endsWith(".admin")) {
                    Authentication auth = accessor.getUser() instanceof Authentication a ? a : null;
                    boolean authorized = auth != null && auth.getAuthorities().stream()
                            .anyMatch(ga -> ADMIN_CHANNEL_AUTHORITIES.contains(ga.getAuthority()));
                    if (!authorized) {
                        throw new AccessDeniedException("Không đủ thẩm quyền subscribe kênh .admin");
                    }
                }
            }
            return message;
        }
    }
}
