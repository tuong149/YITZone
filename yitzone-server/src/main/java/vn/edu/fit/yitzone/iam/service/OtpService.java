package vn.edu.fit.yitzone.iam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Generates, hashes, verifies, and dispatches 6-digit OTPs via SMTP (UC-IAM-01, UC-IAM-03, UC-IAM-05).
 * Falls back to console logging on 'dev'/'test' profiles when SMTP is not configured.
 */
@Service
public class OtpService {
    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JavaMailSender mailSender;
    private final Environment environment;
    private final String mailFrom;
    private final String hashPepper;

    public OtpService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Autowired(required = false) Environment environment,
            @Value("${spring.mail.username:no-reply@yitzone.fit.edu.vn}") String mailFrom,
            @Value("${yitzone.security.jwt-secret:dev-otp-pepper}") String hashPepper
    ) {
        this.mailSender = mailSender;
        this.environment = environment;
        this.mailFrom = mailFrom;
        this.hashPepper = hashPepper;
    }

    public GeneratedOtp generateOtp(UserAuthIdentity.OtpPurpose purpose) {
        int codeInt = SECURE_RANDOM.nextInt(1_000_000);
        String rawCode = String.format("%06d", codeInt);
        Duration ttl = switch (purpose) {
            case EMAIL_REGISTER_VERIFY -> Duration.ofMinutes(10);
            case PASSWORD_RESET, PERSONAL_EMAIL_LINK, PASSWORD_SETUP -> Duration.ofMinutes(15);
        };
        Instant expiresAt = Instant.now().plus(ttl);
        return new GeneratedOtp(rawCode, hashOtp(rawCode), purpose, expiresAt);
    }

    public String hashOtp(String rawCode) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest((rawCode + ":" + hashPepper).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot hash OTP", ex);
        }
    }

    public boolean verifyOtp(String rawCode, String expectedHash, Instant expiresAt) {
        if (rawCode == null || expectedHash == null || expiresAt == null) {
            return false;
        }
        if (Instant.now().isAfter(expiresAt)) {
            return false;
        }
        String candidateHash = hashOtp(rawCode.trim());
        return MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                expectedHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    public void sendOtpEmail(String toEmail, String rawOtp, UserAuthIdentity.OtpPurpose purpose, Instant expiresAt) {
        String subject = switch (purpose) {
            case EMAIL_REGISTER_VERIFY -> "[YITZone] Mã OTP xác thực đăng ký tài khoản";
            case PASSWORD_RESET -> "[YITZone] Mã OTP đặt lại mật khẩu";
            case PERSONAL_EMAIL_LINK -> "[YITZone] Mã OTP liên kết email cá nhân dự phòng";
            case PASSWORD_SETUP -> "[YITZone] Mã OTP thiết lập mật khẩu đăng nhập";
        };
        String body = """
                Xin chào,

                Mã xác thực OTP của bạn trên hệ thống YITZone là: %s
                Mã có hiệu lực đến: %s (không chia sẻ mã này cho bất kỳ ai).

                Trân trọng,
                Đoàn - Hội Khoa Công nghệ Thông tin (YITZone)
                """.formatted(rawOtp, expiresAt);

        sendEmailOrLog(toEmail, subject, body);
    }

    public void sendSecurityAlertEmail(String toEmail, String subject, String body) {
        sendEmailOrLog(toEmail, subject, body);
    }

    private void sendEmailOrLog(String toEmail, String subject, String body) {
        boolean isDevOrTest = environment == null || environment.acceptsProfiles(Profiles.of("dev", "test"));
        if (mailSender != null && !isDevOrTest) {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            return;
        }
        if (mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(mailFrom);
                msg.setTo(toEmail);
                msg.setSubject(subject);
                msg.setText(body);
                mailSender.send(msg);
                return;
            } catch (Exception ex) {
                log.info("[DEV MAIL FALLBACK] SMTP unavailable ({}); logging email instead.", ex.getMessage());
            }
        }
        log.info("[DEV MAIL] To: {} | Subject: {} | Body: {}", toEmail, subject, body.replace("\n", " "));
    }

    public record GeneratedOtp(
            String rawCode,
            String otpHash,
            UserAuthIdentity.OtpPurpose purpose,
            Instant expiresAt
    ) {
    }
}
