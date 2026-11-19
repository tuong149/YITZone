package vn.edu.fit.yitzone.store.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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

    private final String webhookSecret;
    private final Map<String, Map<String, Object>> idempotentOrderCache = new ConcurrentHashMap<>();

    public StoreController(@Value("${yitzone.payment.webhook-secret}") String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request,
            Authentication auth
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Bắt buộc đính kèm Header Idempotency-Key (UUIDv4) khi tạo đơn hàng");
        }
        String cacheKey = auth.getName() + ":POST:/api/v1/store/orders:" + idempotencyKey;
        Map<String, Object> existing = idempotentOrderCache.get(cacheKey);
        if (existing != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(existing));
        }

        Map<String, Object> created = Map.of(
                "orderCode", "YITZ-ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                "buyerId", auth.getName(),
                "paymentMethod", request.paymentMethod(),
                "deliveryMethod", request.deliveryMethod(),
                "status", "COD".equalsIgnoreCase(request.paymentMethod()) ? "PENDING_COD" : "PENDING_PAYMENT",
                "idempotencyKey", idempotencyKey
        );
        idempotentOrderCache.put(cacheKey, created);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    /**
     * POST barcode-lookup prevents exposing studentCode PII in GET URL / access logs (ISS-05).
     */
    @PostMapping("/orders/barcode-lookup")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('store', 'scan_barcode')")
    public ApiResponse<Map<String, Object>> lookupOrdersByStudentBarcode(
            @Valid @RequestBody StudentBarcodeLookupRequest request
    ) {
        return ApiResponse.ok(Map.of(
                "studentCode", request.studentCode(),
                "hardwareType", request.hardwareType() == null ? "USB_BLUETOOTH_HID" : request.hardwareType(),
                "orders", List.of()
        ));
    }

    @PostMapping("/orders/{id}/fulfill")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('store', 'fulfill')")
    public ApiResponse<Map<String, Object>> fulfillOrder(
            @PathVariable String id,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            Authentication auth
    ) {
        return ApiResponse.ok(Map.of(
                "orderId", id,
                "status", "COMPLETED",
                "fulfilledBy", auth.getName(),
                "idempotencyKey", idempotencyKey
        ));
    }

    /**
     * VietQR Payment webhook endpoint with raw-body constant-time HMAC-SHA256 & 300s timestamp window (ISS-01, A11).
     */
    @PostMapping("/webhooks/vietqr")
    public ApiResponse<Map<String, Object>> handleVietQrWebhook(
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
        return ApiResponse.ok(Map.of("verified", true, "timestamp", webhookTimestampEpochSec));
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

    public record StudentBarcodeLookupRequest(
            @NotBlank @Pattern(regexp = "^[0-9]{8}$", message = "MSSV phải gồm đúng 8 chữ số") String studentCode,
            String hardwareType
    ) {}
}
