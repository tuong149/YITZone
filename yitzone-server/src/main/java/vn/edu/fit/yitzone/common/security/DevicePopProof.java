package vn.edu.fit.yitzone.common.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Canonical ECDSA P-256 Device Proof-of-Possession (PoP) envelope (API Overview 4.1, LLD 5.1/5.2/5.8).
 * Canonical Payload = HTTP_METHOD | URI_PATH | userId | timestamp | nonce | SHA-256(canonicalActionFields)
 */
public record DevicePopProof(
        @Positive long timestamp,
        @NotBlank String nonce,
        @NotBlank String signature
) {}
