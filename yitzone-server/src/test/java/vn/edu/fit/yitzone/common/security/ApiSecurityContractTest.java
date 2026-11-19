package vn.edu.fit.yitzone.common.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.pwa.controller.PwaController;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ApiSecurityContractTest {

    @Test
    @DisplayName("ISS-02: Canonical ECDSA P-256 Device PoP verifies valid window and blocks replay nonce")
    void shouldVerifyCanonicalDevicePopAndBlockReplayNonce() {
        DevicePopVerifierService verifier = new DevicePopVerifierService();
        long now = Instant.now().getEpochSecond();
        String nonce = UUID.randomUUID().toString();
        DevicePopProof proof = new DevicePopProof(now, nonce, "MEUCIQDf7_mock_ecdsa_sig");

        String canonical = verifier.verifyAndBuildCanonicalString(
                "POST",
                "/api/v1/voting/campaigns/camp-1/cast-ballot",
                "user-101",
                proof,
                "camp-1|CAND_01,CAND_02|"
        );

        assertTrue(canonical.startsWith("POST|/api/v1/voting/campaigns/camp-1/cast-ballot|user-101|" + now + "|" + nonce + "|"));

        BusinessException replayEx = assertThrows(BusinessException.class, () ->
                verifier.verifyAndBuildCanonicalString(
                        "POST",
                        "/api/v1/voting/campaigns/camp-1/cast-ballot",
                        "user-101",
                        proof,
                        "camp-1|CAND_01,CAND_02|"
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
                verifier.verifyAndBuildCanonicalString("POST", "/api/v1/attendance/check-in", "user-1", expiredProof, "evt|s1|100")
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
