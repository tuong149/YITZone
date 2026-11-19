package vn.edu.fit.yitzone.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.DevicePopVerifierService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/store")
public class StoreController {
    private static final long WEBHOOK_MAX_SKEW_SECONDS = 300L;
    private static final int MAX_LOCAL_IDEMPOTENCY_ENTRIES = 5000;

    private final String webhookSecret;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedIdempotentOrder> idempotentOrderCache = new ConcurrentHashMap<>();

    public StoreController(
            @Value("${yitzone.payment.webhook-secret}") String webhookSecret,
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            @Autowired(required = false) ObjectMapper objectMapper
    ) {
        this.webhookSecret = webhookSecret;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request,
            Authentication auth
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Bắt buộc đính kèm Header Idempotency-Key (UUIDv4) khi tạo đơn hàng");
        }
        String cleanKey = idempotencyKey.trim();
        String payloadHash = computeRequestPayloadHash(request);
        String cacheKey = "idemp:" + auth.getName() + ":POST:/api/v1/store/orders:" + cleanKey;

        if (idempotentOrderCache.size() > MAX_LOCAL_IDEMPOTENCY_ENTRIES) {
            long cutoff = Instant.now().minusSeconds(86400).getEpochSecond();
            idempotentOrderCache.entrySet().removeIf(e -> e.getValue().createdAtEpochSec() < cutoff);
        }

        OrderResponse newOrder = new OrderResponse(
                "YITZ-ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                auth.getName(),
                request.paymentMethod(),
                request.deliveryMethod(),
                "COD".equalsIgnoreCase(request.paymentMethod()) ? "PENDING_COD" : "PENDING_PAYMENT",
                cleanKey
        );

        CachedIdempotentOrder newEntry = new CachedIdempotentOrder(payloadHash, newOrder, Instant.now().getEpochSecond());
        CachedIdempotentOrder existing = idempotentOrderCache.putIfAbsent(cacheKey, newEntry);
        if (existing != null) {
            if (!existing.payloadHash().equals(payloadHash)) {
                throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                        "Idempotency-Key đã được sử dụng cho một nội dung đơn hàng khác");
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(existing.response()));
        }

        if (redisTemplate != null) {
            try {
                String serialized = objectMapper.writeValueAsString(newEntry);
                Boolean stored = redisTemplate.opsForValue().setIfAbsent(cacheKey, serialized, Duration.ofHours(24));
                if (Boolean.FALSE.equals(stored)) {
                    String cachedJson = redisTemplate.opsForValue().get(cacheKey);
                    if (cachedJson != null) {
                        CachedIdempotentOrder fromRedis = objectMapper.readValue(cachedJson, CachedIdempotentOrder.class);
                        if (!fromRedis.payloadHash().equals(payloadHash)) {
                            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                                    "Idempotency-Key đã được sử dụng cho một nội dung đơn hàng khác");
                        }
                        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(fromRedis.response()));
                    }
                }
            } catch (BusinessException e) {
                throw e;
            } catch (Exception ignored) {
                // Fallback to atomic ConcurrentHashMap entry already inserted above
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(newOrder));
    }

    private String computeRequestPayloadHash(CreateOrderRequest request) {
        try {
            return DevicePopVerifierService.sha256Hex(objectMapper.writeValueAsString(request));
        } catch (Exception e) {
            return DevicePopVerifierService.sha256Hex(
                    request.deliveryMethod() + "|" + request.paymentMethod() + "|" + request.voucherCode() + "|" + request.items().size()
            );
        }
    }

    /**
     * POST barcode-lookup prevents exposing studentCode PII in GET URL / access logs (ISS-05).
     */
    @PostMapping("/orders/barcode-lookup")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('store', 'scan_barcode')")
    public ApiResponse<BarcodeOrderLookupResponse> lookupOrdersByStudentBarcode(
            @Valid @RequestBody StudentBarcodeLookupRequest request
    ) {
        return ApiResponse.ok(new BarcodeOrderLookupResponse(
                request.studentCode(),
                request.hardwareType() == null ? "USB_BLUETOOTH_HID" : request.hardwareType(),
                List.of()
        ));
    }

    @PostMapping("/orders/{id}/fulfill")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('store', 'fulfill')")
    public ApiResponse<OrderFulfillResponse> fulfillOrder(
            @PathVariable String id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            Authentication auth
    ) {
        return ApiResponse.ok(new OrderFulfillResponse(
                id,
                "COMPLETED",
                auth.getName(),
                idempotencyKey
        ));
    }

    /**
     * VietQR Payment webhook endpoint with raw-body constant-time HMAC-SHA256 & 300s timestamp window (ISS-01, A11).
     */
    @PostMapping("/webhooks/vietqr")
    public ApiResponse<WebhookVerificationResponse> handleVietQrWebhook(
            @RequestHeader("X-Webhook-Timestamp") long webhookTimestampEpochSec,
            @RequestHeader("X-Webhook-Signature") String signature,
            @RequestBody byte[] rawBodyBytes
    ) {
        long nowEpochSec = Instant.now().getEpochSecond();
        if (Math.abs(nowEpochSec - webhookTimestampEpochSec) > WEBHOOK_MAX_SKEW_SECONDS) {
            throw new BusinessException(ErrorCode.WEBHOOK_TIMESTAMP_EXPIRED, HttpStatus.UNAUTHORIZED,
                    "Webhook timestamp vượt quá cửa sổ 300 giây chống Replay");
        }
        if (!verifyHmacSha256ConstantTime(webhookTimestampEpochSec, rawBodyBytes, signature)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                    "Chữ ký Webhook HMAC-SHA256 không hợp lệ");
        }
        return ApiResponse.ok(new WebhookVerificationResponse(true, webhookTimestampEpochSec));
    }

    private boolean verifyHmacSha256ConstantTime(long timestampEpochSec, byte[] rawBodyBytes, String providedSignature) {
        try {
            String cleanSig = providedSignature.startsWith("sha256=")
                    ? providedSignature.substring("sha256=".length())
                    : providedSignature;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] prefix = (timestampEpochSec + ".").getBytes(StandardCharsets.UTF_8);
            mac.update(prefix);
            String expectedHex = HexFormat.of().formatHex(mac.doFinal(rawBodyBytes));
            return MessageDigest.isEqual(
                    expectedHex.getBytes(StandardCharsets.UTF_8),
                    cleanSig.toLowerCase().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    public record CreateOrderRequest(
            @NotEmpty List<Map<String, Object>> items,
            @NotBlank String deliveryMethod,
            @NotBlank String paymentMethod,
            String voucherCode
    ) {}

    public record OrderResponse(
            String orderCode,
            String buyerId,
            String paymentMethod,
            String deliveryMethod,
            String status,
            String idempotencyKey
    ) {}

    private record CachedIdempotentOrder(
            String payloadHash,
            OrderResponse response,
            long createdAtEpochSec
    ) {}

    public record StudentBarcodeLookupRequest(
            @NotBlank @Pattern(regexp = "^[0-9]{8}$", message = "MSSV phải gồm đúng 8 chữ số") String studentCode,
            String hardwareType
    ) {}

    public record BarcodeOrderLookupResponse(
            String studentCode,
            String hardwareType,
            List<OrderResponse> orders
    ) {}

    public record OrderFulfillResponse(
            String orderId,
            String status,
            String fulfilledBy,
            String idempotencyKey
    ) {}

    public record WebhookVerificationResponse(
            boolean verified,
            long timestamp
    ) {}
}
