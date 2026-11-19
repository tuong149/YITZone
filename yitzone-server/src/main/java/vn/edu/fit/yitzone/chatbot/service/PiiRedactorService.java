package vn.edu.fit.yitzone.chatbot.service;

import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Strips PII (email, phone with optional spaces/dots/dashes, 8-digit MSSV) before sending prompts to external LLM providers (NFR-PRIV / SRS EXT-AI-01).
 */
@Service
public class PiiRedactorService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?<!\\d)(?:\\+84|0)[\\s.-]?(?:3|5|7|8|9)[0-9]{2}[\\s.-]?[0-9]{3}[\\s.-]?[0-9]{3}(?!\\d)");
    private static final Pattern MSSV_PATTERN = Pattern.compile("\\b[0-9]{8}\\b");

    public String redact(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        String sanitized = EMAIL_PATTERN.matcher(input).replaceAll("[REDACTED_EMAIL]");
        sanitized = PHONE_PATTERN.matcher(sanitized).replaceAll("[REDACTED_PHONE]");
        return MSSV_PATTERN.matcher(sanitized).replaceAll("[REDACTED_MSSV]");
    }
}
