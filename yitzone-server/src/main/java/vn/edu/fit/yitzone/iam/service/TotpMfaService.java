package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;

/**
 * RFC 6238 TOTP MFA service for BTV / SystemAdmin (UC-IAM-03, NFR-AUTH-01).
 * Uses Base32 secrets, HMAC-SHA1 6-digit codes (30s step, +/-1 window), and AES-256-GCM storage encryption.
 */
@Service
public class TotpMfaService {
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SecretKeySpec aesKey;

    public TotpMfaService(@Value("${yitzone.security.jwt-secret:dev-mfa-encryption-secret}") String masterSecret) {
        this.aesKey = deriveAes256Key(masterSecret);
    }

    public String generateBase32Secret() {
        byte[] bytes = new byte[20]; // 160-bit secret per RFC 4226
        SECURE_RANDOM.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    public String buildOtpAuthUri(String email, String base32Secret) {
        String issuer = URLEncoder.encode("YITZone", StandardCharsets.UTF_8);
        String account = URLEncoder.encode(email, StandardCharsets.UTF_8);
        return "otpauth://totp/" + issuer + ":" + account
                + "?secret=" + base32Secret
                + "&issuer=" + issuer
                + "&algorithm=SHA1&digits=" + CODE_DIGITS
                + "&period=" + TIME_STEP_SECONDS;
    }

    public String generateCode(String base32Secret, Instant at) {
        long counter = at.getEpochSecond() / TIME_STEP_SECONDS;
        return generateCodeForCounter(decodeBase32(base32Secret), counter);
    }

    public boolean verifyCode(String base32Secret, String candidateCode, Instant at) {
        if (base32Secret == null || candidateCode == null || !candidateCode.trim().matches("^\\d{6}$")) {
            return false;
        }
        byte[] key = decodeBase32(base32Secret);
        long currentCounter = at.getEpochSecond() / TIME_STEP_SECONDS;
        String trimmed = candidateCode.trim();
        for (long offset = -1; offset <= 1; offset++) {
            String expected = generateCodeForCounter(key, currentCounter + offset);
            if (MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    trimmed.getBytes(StandardCharsets.UTF_8)
            )) {
                return true;
            }
        }
        return false;
    }

    public String encryptSecret(String plainBase32Secret) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plainBase32Secret.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to encrypt TOTP secret", ex);
        }
    }

    public String decryptSecret(String encryptedSecret) {
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedSecret);
            byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_LENGTH);
            byte[] ciphertext = Arrays.copyOfRange(combined, GCM_IV_LENGTH, combined.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] plain = cipher.doFinal(ciphertext);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to decrypt TOTP secret", ex);
        }
    }

    private String generateCodeForCounter(byte[] key, long counter) {
        try {
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % 1_000_000;
            return String.format("%06d", otp);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute TOTP", ex);
        }
    }

    private SecretKeySpec deriveAes256Key(String masterSecret) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(("yitzone-totp-aes:" + masterSecret).getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to derive AES key", ex);
        }
    }

    static String encodeBase32(byte[] data) {
        StringBuilder out = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                out.append(BASE32_ALPHABET.charAt(index));
            }
        }
        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            out.append(BASE32_ALPHABET.charAt(index));
        }
        return out.toString();
    }

    static byte[] decodeBase32(String base32) {
        String normalized = base32.trim().replace("=", "").replace(" ", "").toUpperCase();
        byte[] result = new byte[normalized.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int count = 0;
        for (int i = 0; i < normalized.length(); i++) {
            int val = BASE32_ALPHABET.indexOf(normalized.charAt(i));
            if (val < 0) {
                throw new IllegalArgumentException("Invalid Base32 character: " + normalized.charAt(i));
            }
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[count++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return Arrays.copyOf(result, count);
    }
}
