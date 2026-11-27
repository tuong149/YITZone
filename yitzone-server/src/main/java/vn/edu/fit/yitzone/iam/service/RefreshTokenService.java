package vn.edu.fit.yitzone.iam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages Refresh Token rotation, Idle Timeout (<= 30m admin / <= 7d student),
 * and bulk session revocation via refreshTokenVersion (UC-IAM-03, NFR-AUTH-01).
 */
@Service
public class RefreshTokenService {
    private static final String REFRESH_KEY_PREFIX = "auth:rt:";
    private static final String MIN_RT_VER_PREFIX = "auth:rtVer:";
    private static final Duration ADMIN_IDLE_TIMEOUT = Duration.ofMinutes(30);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration studentIdleTimeout;
    private final Map<String, RefreshSessionRecord> localSessions = new ConcurrentHashMap<>();
    private final Map<String, Long> localMinRtVersions = new ConcurrentHashMap<>();

    public RefreshTokenService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${yitzone.security.refresh-token-ttl-seconds:604800}") long studentTtlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.studentIdleTimeout = Duration.ofSeconds(Math.min(studentTtlSeconds, 604800L));
    }

    public IssuedRefreshToken issueRefreshToken(String userId, long refreshTokenVersion, boolean privilegedAdmin) {
        byte[] rawBytes = new byte[32];
        SECURE_RANDOM.nextBytes(rawBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);
        String tokenHash = sha256Hex(rawToken);
        Duration ttl = privilegedAdmin ? ADMIN_IDLE_TIMEOUT : studentIdleTimeout;
        Instant now = Instant.now();
        Instant expiresAt = now.plus(ttl);

        RefreshSessionRecord record = new RefreshSessionRecord(
                userId,
                refreshTokenVersion,
                privilegedAdmin,
                now,
                expiresAt
        );
        saveSession(tokenHash, record, ttl);
        return new IssuedRefreshToken(rawToken, expiresAt, ttl.toSeconds());
    }

    public RotatedSession rotateRefreshToken(String rawRefreshToken, long currentUserRefreshTokenVersion) {
        return rotateRefreshToken(rawRefreshToken, uid -> currentUserRefreshTokenVersion);
    }

    public RotatedSession rotateRefreshToken(
            String rawRefreshToken,
            java.util.function.Function<String, Long> currentVersionResolver
    ) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Refresh token không hợp lệ hoặc đã hết hạn");
        }
        String tokenHash = sha256Hex(rawRefreshToken);
        RefreshSessionRecord existing = loadAndDeleteSession(tokenHash);
        if (existing == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Phiên đăng nhập không tồn tại hoặc đã bị thu hồi");
        }
        Instant now = Instant.now();
        if (now.isAfter(existing.expiresAt())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Phiên đăng nhập đã hết hạn do không hoạt động");
        }
        Long resolvedVersion = currentVersionResolver == null ? 1L : currentVersionResolver.apply(existing.userId());
        long dbVersion = resolvedVersion == null ? 1L : resolvedVersion;
        long minVersion = Math.max(dbVersion, getMinRefreshTokenVersion(existing.userId()));
        if (existing.refreshTokenVersion() < minVersion) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Phiên đăng nhập đã bị thu hồi do thay đổi mật khẩu hoặc bảo mật");
        }
        IssuedRefreshToken next = issueRefreshToken(
                existing.userId(),
                minVersion,
                existing.privilegedAdmin()
        );
        return new RotatedSession(existing.userId(), existing.privilegedAdmin(), next);
    }

    public void revokeSingleToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = sha256Hex(rawRefreshToken);
        localSessions.remove(tokenHash);
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(REFRESH_KEY_PREFIX + tokenHash);
            } catch (Exception ignored) {
                // Fallback to local map
            }
        }
    }

    public void revokeAllUserTokens(String userId, long newRefreshTokenVersion) {
        localMinRtVersions.merge(userId, newRefreshTokenVersion, Math::max);
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(
                        MIN_RT_VER_PREFIX + userId,
                        String.valueOf(newRefreshTokenVersion),
                        studentIdleTimeout
                );
            } catch (Exception ignored) {
                // Fallback to local map
            }
        }
    }

    private void saveSession(String tokenHash, RefreshSessionRecord record, Duration ttl) {
        localSessions.put(tokenHash, record);
        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(record);
                redisTemplate.opsForValue().set(REFRESH_KEY_PREFIX + tokenHash, json, ttl);
            } catch (Exception ignored) {
                // Fallback to local map when Redis is unavailable
            }
        }
    }

    private RefreshSessionRecord loadAndDeleteSession(String tokenHash) {
        if (redisTemplate != null) {
            try {
                String json = redisTemplate.opsForValue().getAndDelete(REFRESH_KEY_PREFIX + tokenHash);
                if (json != null) {
                    localSessions.remove(tokenHash);
                    return objectMapper.readValue(json, RefreshSessionRecord.class);
                }
            } catch (Exception ignored) {
                // Fallback to local map
            }
        }
        return localSessions.remove(tokenHash);
    }

    private long getMinRefreshTokenVersion(String userId) {
        long localMin = localMinRtVersions.getOrDefault(userId, 1L);
        if (redisTemplate != null) {
            try {
                String val = redisTemplate.opsForValue().get(MIN_RT_VER_PREFIX + userId);
                if (val != null) {
                    long redisMin = Long.parseLong(val);
                    localMinRtVersions.merge(userId, redisMin, Math::max);
                    return Math.max(localMin, redisMin);
                }
            } catch (Exception ignored) {
                // Fallback to local map
            }
        }
        return localMin;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot hash refresh token", ex);
        }
    }

    public record RefreshSessionRecord(
            String userId,
            long refreshTokenVersion,
            boolean privilegedAdmin,
            Instant lastActivityAt,
            Instant expiresAt
    ) {
    }

    public record IssuedRefreshToken(
            String rawToken,
            Instant expiresAt,
            long ttlSeconds
    ) {
    }

    public record RotatedSession(
            String userId,
            boolean privilegedAdmin,
            IssuedRefreshToken nextToken
    ) {
    }
}
