package vn.edu.fit.yitzone.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

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
    public MessageListener rbacInvalidationListener() {
        return (message, pattern) ->
                log.info("Received RBAC cache invalidation event on channel {}: {}",
                        RBAC_INVALIDATE_CHANNEL, new String(message.getBody()));
    }
}
