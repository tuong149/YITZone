package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.config.RedisConfig;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Evicts RBAC cache and broadcasts Pub/Sub invalidation within <= 5s (LLD 2.3.7).
 */
@Service
public class RbacCacheInvalidationService {
    private static final String RBAC_CACHE_PREFIX = "rbac:permissions:";
    private static final String RBAC_PERM_VER_PREFIX = "rbac:permVer:";
    private final StringRedisTemplate redisTemplate;
    private final Map<String, Long> localMinPermVersions = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> localUserScopes = new ConcurrentHashMap<>();

    public RbacCacheInvalidationService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void invalidateUserPermissions(String userId, long newPermissionVersion) {
        localMinPermVersions.put(userId, newPermissionVersion);
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(RBAC_CACHE_PREFIX + userId);
                redisTemplate.opsForValue().set(RBAC_PERM_VER_PREFIX + userId, String.valueOf(newPermissionVersion));
                redisTemplate.convertAndSend(
                        RedisConfig.RBAC_INVALIDATE_CHANNEL,
                        "{\"userId\":\"" + userId + "\",\"newPermissionVersion\":" + newPermissionVersion + "}"
                );
            } catch (Exception ignored) {
                // Fallback to localMinPermVersions when Redis is unavailable
            }
        }
    }

    public void applyRemoteInvalidation(String userId, long newPermissionVersion) {
        if (userId != null) {
            localMinPermVersions.merge(userId, newPermissionVersion, Math::max);
        }
    }

    public boolean isTokenVersionValid(String userId, long tokenPermVersion) {
        Long localMin = localMinPermVersions.get(userId);
        if (localMin != null && tokenPermVersion < localMin) {
            return false;
        }
        if (redisTemplate != null) {
            try {
                String val = redisTemplate.opsForValue().get(RBAC_PERM_VER_PREFIX + userId);
                if (val != null) {
                    long minVer = Long.parseLong(val);
                    localMinPermVersions.put(userId, minVer);
                    return tokenPermVersion >= minVer;
                }
            } catch (Exception ignored) {
                // Redis unreachable in unit test or local standalone mode
            }
        }
        return true;
    }

    public void registerLocalUserScopes(String userId, Set<String> scopes) {
        if (userId != null && scopes != null) {
            localUserScopes.put(userId, Set.copyOf(scopes));
        }
    }

    public Set<String> getLocalUserScopes(String userId) {
        return localUserScopes.get(userId);
    }
}
