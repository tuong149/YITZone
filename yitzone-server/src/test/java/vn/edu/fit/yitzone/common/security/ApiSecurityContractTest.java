package vn.edu.fit.yitzone.common.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.pwa.controller.PwaController;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ApiSecurityContractTest {

    private static KeyPair generateP256KeyPair() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
        kpg.initialize(new ECGenParameterSpec("secp256r1"));
        return kpg.generateKeyPair();
    }

    private static Map<String, Object> toPublicKeyJwk(ECPublicKey publicKey) {
        String x = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(publicKey.getW().getAffineX().toByteArray());
        String y = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(publicKey.getW().getAffineY().toByteArray());
        return Map.of("kty", "EC", "crv", "P-256", "x", x, "y", y);
    }

    private static String signP1363Base64(PrivateKey privateKey, String canonicalPayload) throws Exception {
        Signature sig = Signature.getInstance("SHA256withECDSAinP1363Format");
        sig.initSign(privateKey);
        sig.update(canonicalPayload.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(sig.sign());
    }

    @Test
    @DisplayName("ISS-02: Canonical ECDSA P-256 Device PoP verifies real P1363 signature, rejects forged signature, and blocks replay nonce")
    void shouldVerifyCanonicalDevicePopAndBlockReplayNonce() throws Exception {
        DevicePopVerifierService verifier = new DevicePopVerifierService();
        String userId = "user-101";
        KeyPair keyPair = generateP256KeyPair();
        verifier.registerDeviceKeyForUser(userId, toPublicKeyJwk((ECPublicKey) keyPair.getPublic()), "JUnit-WebCrypto");

        long now = Instant.now().getEpochSecond();
        String nonce = UUID.randomUUID().toString();
        String actionFields = "camp-1|CAND_01,CAND_02|";
        String canonicalPayload = String.join("|",
                "POST",
                "/api/v1/voting/campaigns/camp-1/cast-ballot",
                userId,
                String.valueOf(now),
                nonce,
                DevicePopVerifierService.sha256Hex(actionFields)
        );

        // 1. Forged signature must fail BEFORE burning the nonce
        DevicePopProof forgedProof = new DevicePopProof(now, nonce, Base64.getEncoder().encodeToString(new byte[64]));
        BusinessException forgedEx = assertThrows(BusinessException.class, () ->
                verifier.verifyDevicePop(
                        "POST",
                        "/api/v1/voting/campaigns/camp-1/cast-ballot",
                        userId,
                        forgedProof,
                        actionFields
                )
        );
        assertEquals(ErrorCode.INVALID_DEVICE_POP, forgedEx.getErrorCode());

        // 2. Real ECDSA P-256 IEEE P1363 signature with the same nonce succeeds (nonce was not burned by attacker!)
        String realSignature = signP1363Base64(keyPair.getPrivate(), canonicalPayload);
        DevicePopProof validProof = new DevicePopProof(now, nonce, realSignature);

        String verifiedCanonical = verifier.verifyDevicePop(
                "POST",
                "/api/v1/voting/campaigns/camp-1/cast-ballot",
                userId,
                validProof,
                actionFields
        );
        assertEquals(canonicalPayload, verifiedCanonical);

        // 3. Replaying the valid proof with the same nonce must be rejected with POP_NONCE_REPLAYED
        BusinessException replayEx = assertThrows(BusinessException.class, () ->
                verifier.verifyDevicePop(
                        "POST",
                        "/api/v1/voting/campaigns/camp-1/cast-ballot",
                        userId,
                        validProof,
                        actionFields
                )
        );
        assertEquals(ErrorCode.POP_NONCE_REPLAYED, replayEx.getErrorCode());
    }

    @Test
    @DisplayName("ISS-02: Canonical Device PoP rejects expired timestamp (> 30s skew)")
    void shouldRejectExpiredDevicePopTimestamp() {
        DevicePopVerifierService verifier = new DevicePopVerifierService();
        long expiredTs = Instant.now().getEpochSecond() - 45;
        DevicePopProof expiredProof = new DevicePopProof(expiredTs, UUID.randomUUID().toString(), "sig");

        BusinessException ex = assertThrows(BusinessException.class, () ->
                verifier.verifyDevicePop("POST", "/api/v1/attendance/check-in", "user-1", expiredProof, "evt|s1|100")
        );
        assertEquals(ErrorCode.INVALID_DEVICE_POP, ex.getErrorCode());
    }

    @Test
    @DisplayName("ISS-04: Web Push subscription blocks SSRF internal/non-allowlisted endpoints")
    void shouldAllowLegitimatePushEndpointsAndBlockSsrf() {
        assertDoesNotThrow(() ->
                PwaController.validatePushEndpointAgainstSsrf("https://fcm.googleapis.com/fcm/send/abc-123")
        );
        assertDoesNotThrow(() ->
                PwaController.validatePushEndpointAgainstSsrf("https://web.push.apple.com/Q1w2e3r4")
        );

        BusinessException localhostEx = assertThrows(BusinessException.class, () ->
                PwaController.validatePushEndpointAgainstSsrf("https://127.0.0.1:8080/internal/admin")
        );
        assertEquals(ErrorCode.SSRF_ENDPOINT_REJECTED, localhostEx.getErrorCode());

        BusinessException httpEx = assertThrows(BusinessException.class, () ->
                PwaController.validatePushEndpointAgainstSsrf("http://fcm.googleapis.com/fcm/send/abc")
        );
        assertEquals(ErrorCode.SSRF_ENDPOINT_REJECTED, httpEx.getErrorCode());
    }
}
