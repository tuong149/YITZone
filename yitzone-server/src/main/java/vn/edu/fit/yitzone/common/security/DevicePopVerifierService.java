package vn.edu.fit.yitzone.common.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.DeviceToken;
import vn.edu.fit.yitzone.iam.repository.DeviceTokenRepository;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verifies Canonical ECDSA P-256 Device PoP timestamp window (<= 30s), cryptographic ECDSA signature
 * (IEEE P1363 raw r||s from WebCrypto or ASN.1 DER), and anti-replay nonce (ISS-02).
 */
@Service
public class DevicePopVerifierService {
    private static final long MAX_CLOCK_SKEW_SECONDS = 30L;
    private static final long NONCE_TTL_SECONDS = 60L;
    private static final String REDIS_NONCE_PREFIX = "pop:nonce:";

    private final DeviceTokenRepository deviceTokenRepository;
    private final StringRedisTemplate redisTemplate;

    // Fallback in-memory nonce & JWK cache when Redis/Mongo are not connected in unit/local environments
    private final Map<String, Long> usedNonces = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> inMemoryUserJwks = new ConcurrentHashMap<>();

    public DevicePopVerifierService() {
        this(null, null);
    }

    @Autowired
    public DevicePopVerifierService(
            @Autowired(required = false) DeviceTokenRepository deviceTokenRepository,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.redisTemplate = redisTemplate;
    }

    public void registerDeviceKeyForUser(String userId, Map<String, Object> publicKeyJwk, String userAgent) {
        if (userId == null || publicKeyJwk == null || publicKeyJwk.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Thiếu thông tin publicKeyJwk");
        }
        // Validate that the JWK can be parsed as a valid P-256 public key before storing
        parseP256PublicKeyFromJwk(publicKeyJwk);

        inMemoryUserJwks.compute(userId, (k, existing) -> {
            List<Map<String, Object>> list = existing == null ? new ArrayList<>() : new ArrayList<>(existing);
            list.add(Map.copyOf(publicKeyJwk));
            return list;
        });

        if (deviceTokenRepository != null) {
            try {
                String jwkThumbprint = sha256Hex(userId + ":" + publicKeyJwk.get("x") + ":" + publicKeyJwk.get("y"));
                DeviceToken token = deviceTokenRepository.findByTokenHashAndRevokedFalse(jwkThumbprint)
                        .orElseGet(DeviceToken::new);
                token.setUserId(userId);
                token.setTokenHash(jwkThumbprint);
                token.setPublicKeyJwk(publicKeyJwk);
                token.setUserAgent(userAgent);
                token.setLastUsedAt(Instant.now());
                token.setRevoked(false);
                deviceTokenRepository.save(token);
            } catch (Exception ignored) {
                // Fallback to inMemoryUserJwks when MongoDB is unavailable in unit tests
            }
        }
    }

    /**
     * Verifies timestamp window, checks that the nonce has not been used, verifies the ECDSA P-256 signature
     * against the user's registered public key(s) BEFORE consuming the nonce, and returns the canonical string.
     */
    public String verifyDevicePop(
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

        if (isNonceAlreadyUsed(pop.nonce(), nowEpochSec)) {
            throw new BusinessException(ErrorCode.POP_NONCE_REPLAYED, HttpStatus.FORBIDDEN,
                    "Phát hiện sử dụng lại nonce của chữ ký thiết bị (Replay Attack)");
        }

        String actionSha256 = sha256Hex(canonicalActionFields);
        String canonicalPayload = String.join("|",
                httpMethod.toUpperCase(),
                uriPath,
                userId,
                String.valueOf(pop.timestamp()),
                pop.nonce(),
                actionSha256
        );

        List<Map<String, Object>> candidateJwks = resolveUserPublicKeys(userId);
        if (candidateJwks.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.FORBIDDEN,
                    "Thiết bị chưa đăng ký khóa công khai ECDSA P-256 (/api/v1/iam/device-tokens)");
        }

        byte[] signatureBytes = decodeBase64Flexible(pop.signature());
        boolean signatureVerified = false;
        for (Map<String, Object> jwk : candidateJwks) {
            PublicKey publicKey = parseP256PublicKeyFromJwk(jwk);
            if (verifyEcdsaP256Signature(publicKey, canonicalPayload, signatureBytes)) {
                signatureVerified = true;
                break;
            }
        }

        if (!signatureVerified) {
            throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.FORBIDDEN,
                    "Chữ ký ECDSA P-256 Device PoP không hợp lệ hoặc không khớp với khóa thiết bị đã đăng ký");
        }

        // Only record the nonce AFTER cryptographic verification succeeds so attackers cannot burn nonces
        if (!markNonceAsUsed(pop.nonce(), nowEpochSec)) {
            throw new BusinessException(ErrorCode.POP_NONCE_REPLAYED, HttpStatus.FORBIDDEN,
                    "Phát hiện sử dụng lại nonce của chữ ký thiết bị (Replay Attack)");
        }

        return canonicalPayload;
    }

    /**
     * Backward-compatible alias that delegates to full cryptographic verification {@link #verifyDevicePop}.
     */
    public String verifyAndBuildCanonicalString(
            String httpMethod,
            String uriPath,
            String userId,
            DevicePopProof pop,
            String canonicalActionFields
    ) {
        return verifyDevicePop(httpMethod, uriPath, userId, pop, canonicalActionFields);
    }

    private List<Map<String, Object>> resolveUserPublicKeys(String userId) {
        List<Map<String, Object>> keys = new ArrayList<>();
        List<Map<String, Object>> local = inMemoryUserJwks.get(userId);
        if (local != null) {
            keys.addAll(local);
        }
        if (deviceTokenRepository != null) {
            try {
                for (DeviceToken dt : deviceTokenRepository.findByUserIdAndRevokedFalse(userId)) {
                    if (dt.getPublicKeyJwk() != null) {
                        keys.add(dt.getPublicKeyJwk());
                    }
                }
            } catch (Exception ignored) {
                // Ignore DB failure if in-memory keys exist
            }
        }
        return keys;
    }

    private boolean isNonceAlreadyUsed(String nonce, long nowEpochSec) {
        evictExpiredNonces(nowEpochSec);
        Long existingExpiry = usedNonces.get(nonce);
        if (existingExpiry != null && existingExpiry > nowEpochSec) {
            return true;
        }
        if (redisTemplate != null) {
            try {
                Boolean exists = redisTemplate.hasKey(REDIS_NONCE_PREFIX + nonce);
                if (Boolean.TRUE.equals(exists)) {
                    return true;
                }
            } catch (Exception ignored) {
                // Fallback to in-memory map
            }
        }
        return false;
    }

    private boolean markNonceAsUsed(String nonce, long nowEpochSec) {
        if (redisTemplate != null) {
            try {
                Boolean setOk = redisTemplate.opsForValue()
                        .setIfAbsent(REDIS_NONCE_PREFIX + nonce, "1", Duration.ofSeconds(NONCE_TTL_SECONDS));
                if (Boolean.FALSE.equals(setOk)) {
                    return false;
                }
            } catch (Exception ignored) {
                // Fallback to in-memory map
            }
        }
        Long existing = usedNonces.putIfAbsent(nonce, nowEpochSec + NONCE_TTL_SECONDS);
        return existing == null || existing <= nowEpochSec;
    }

    public static PublicKey parseP256PublicKeyFromJwk(Map<String, Object> jwk) {
        try {
            Object xObj = jwk.get("x");
            Object yObj = jwk.get("y");
            if (!(xObj instanceof String xStr) || !(yObj instanceof String yStr) || xStr.isBlank() || yStr.isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.BAD_REQUEST,
                        "JWK ECDSA P-256 thiếu tọa độ 'x' hoặc 'y'");
            }
            byte[] xBytes = decodeBase64Flexible(xStr);
            byte[] yBytes = decodeBase64Flexible(yStr);
            ECPoint point = new ECPoint(new BigInteger(1, xBytes), new BigInteger(1, yBytes));

            AlgorithmParameters parameters = AlgorithmParameters.getInstance("EC");
            parameters.init(new ECGenParameterSpec("secp256r1"));
            ECParameterSpec ecParameterSpec = parameters.getParameterSpec(ECParameterSpec.class);

            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            return keyFactory.generatePublic(new ECPublicKeySpec(point, ecParameterSpec));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.BAD_REQUEST,
                    "Không thể đọc khóa công khai ECDSA P-256 từ JWK: " + e.getMessage());
        }
    }

    public static boolean verifyEcdsaP256Signature(PublicKey publicKey, String canonicalPayload, byte[] signatureBytes) {
        if (signatureBytes == null || signatureBytes.length == 0) {
            return false;
        }
        byte[] payloadBytes = canonicalPayload.getBytes(StandardCharsets.UTF_8);
        try {
            // WebCrypto produces 64-byte IEEE P1363 raw r||s signatures; JCA also supports ASN.1 DER
            String algorithm = signatureBytes.length == 64
                    ? "SHA256withECDSAinP1363Format"
                    : "SHA256withECDSA";
            Signature verifier = Signature.getInstance(algorithm);
            verifier.initVerify(publicKey);
            verifier.update(payloadBytes);
            return verifier.verify(signatureBytes);
        } catch (Exception e) {
            return false;
        }
    }

    public static byte[] decodeBase64Flexible(String encoded) {
        try {
            String trimmed = encoded.trim();
            if (trimmed.contains("-") || trimmed.contains("_")) {
                return Base64.getUrlDecoder().decode(trimmed);
            }
            return Base64.getDecoder().decode(trimmed);
        } catch (IllegalArgumentException e) {
            try {
                return Base64.getUrlDecoder().decode(encoded.trim());
            } catch (IllegalArgumentException ex) {
                throw new BusinessException(ErrorCode.INVALID_DEVICE_POP, HttpStatus.FORBIDDEN,
                        "Định dạng Base64/Base64URL của chữ ký thiết bị không hợp lệ");
            }
        }
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
