package vn.edu.fit.yitzone.common.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verifies Canonical ECDSA P-256 Device PoP timestamp window (<= 30s) and anti-replay nonce (ISS-02).
 */
@Service
public class DevicePopVerifierService {
    private static final long MAX_CLOCK_SKEW_SECONDS = 30L;
    private static final long NONCE_TTL_SECONDS = 60L;

    // Fallback in-memory nonce cache when Redis is not connected in unit/local environments
    private final Map<String, Long> usedNonces = new ConcurrentHashMap<>();

    public String verifyAndBuildCanonicalString(
            String httpMethod,
            String uriPath,
            String userId,
            DevicePopProof pop,
            String canonicalActionFields
    ) {
        if (pop == null || pop.nonce() == null || pop.nonce().isBlank() || pop.signature() == null || pop.signature().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.FORBIDDEN,
                    "Thiếu chữ ký bằng chứng sở hữu khóa thiết bị (Canonical ECDSA P-256 Device PoP)");
        }

        long nowEpochSec = Instant.now().getEpochSecond();
        if (Math.abs(nowEpochSec - pop.timestamp()) > MAX_CLOCK_SKEW_SECONDS) {
            throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.FORBIDDEN,
                    "Device PoP timestamp vượt quá cửa sổ 30 giây cho phép");
        }

        evictExpiredNonces(nowEpochSec);
        Long existingExpiry = usedNonces.putIfAbsent(pop.nonce(), nowEpochSec + NONCE_TTL_SECONDS);
        if (existingExpiry != null && existingExpiry > nowEpochSec) {
            throw new BusinessException(ErrorCode.POP_NONCE_REPLAYED, HttpStatus.FORBIDDEN,
                    "Phát hiện sử dụng lại nonce của chữ ký thiết bị (Replay Attack)");
        }

        String actionSha256 = sha256Hex(canonicalActionFields);
        return String.join("|",
                httpMethod.toUpperCase(),
                uriPath,
                userId,
                String.valueOf(pop.timestamp()),
                pop.nonce(),
                actionSha256
        );
    }

    private void evictExpiredNonces(long nowEpochSec) {
        if (usedNonces.size() > 5000) {
            usedNonces.entrySet().removeIf(entry -> entry.getValue() <= nowEpochSec);
        }
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
