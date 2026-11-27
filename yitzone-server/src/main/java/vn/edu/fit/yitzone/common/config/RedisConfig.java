package vn.edu.fit.yitzone.common.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;

import java.nio.charset.StandardCharsets;

@Configuration
public class RedisConfig {
    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);
    public static final String RBAC_INVALIDATE_CHANNEL = "rbac:invalidate";

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            MessageListener rbacInvalidationListener
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(rbacInvalidationListener, new ChannelTopic(RBAC_INVALIDATE_CHANNEL));
        return container;
    }

    @Bean
    public MessageListener rbacInvalidationListener(
            ObjectMapper objectMapper,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheInvalidationService,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService
    ) {
        return (message, pattern) -> {
            String payload = new String(message.getBody(), StandardCharsets.UTF_8);
            log.info("Received RBAC cache invalidation event on channel {}: {}", RBAC_INVALIDATE_CHANNEL, payload);
            if (rbacCacheInvalidationService == null && effectivePermissionService == null) {
                return;
            }
            try {
                JsonNode node = objectMapper.readTree(payload);
                String userId = node.path("userId").asText(null);
                long newVersion = node.path("newPermissionVersion").asLong(0L);
                if (userId != null && newVersion > 0L) {
                    if (rbacCacheInvalidationService != null) {
                        rbacCacheInvalidationService.applyRemoteInvalidation(userId, newVersion);
                    }
                    if (effectivePermissionService != null) {
                        effectivePermissionService.evictLocalCache(userId);
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to parse RBAC invalidation payload: {}", payload, ex);
            }
        };
    }
}
