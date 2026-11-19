package vn.edu.fit.yitzone.iam.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.config.RedisConfig;

/**
 * Evicts RBAC cache and broadcasts Pub/Sub invalidation within <= 5s (LLD 2.3.7).
 */
@Service
public class RbacCacheInvalidationService {
    private static final String RBAC_CACHE_PREFIX = "rbac:permissions:";
    private final StringRedisTemplate redisTemplate;

    public RbacCacheInvalidationService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void invalidateUserPermissions(String userId, long newPermissionVersion) {
        redisTemplate.delete(RBAC_CACHE_PREFIX + userId);
        redisTemplate.convertAndSend(
                RedisConfig.RBAC_INVALIDATE_CHANNEL,
                "{\"userId\":\"" + userId + "\",\"newPermissionVersion\":" + newPermissionVersion + "}"
        );
    }
}
