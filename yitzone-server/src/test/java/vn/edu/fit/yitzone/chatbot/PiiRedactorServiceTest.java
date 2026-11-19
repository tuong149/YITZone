package vn.edu.fit.yitzone.chatbot;

import org.junit.jupiter.api.Test;
import vn.edu.fit.yitzone.chatbot.service.PiiRedactorService;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PiiRedactorServiceTest {

    private final PiiRedactorService redactor = new PiiRedactorService();

    @Test
    void shouldRedactEmailPhoneAndStudentCode() {
        String raw = "Sinh viên 22110123 email sv@fit.edu.vn SĐT 0912345678 hoặc 0912 345 678 hoặc 0912.345.678 hỏi về ĐRL";
        String expected = "Sinh viên [REDACTED_MSSV] email [REDACTED_EMAIL] SĐT [REDACTED_PHONE] hoặc [REDACTED_PHONE] hoặc [REDACTED_PHONE] hỏi về ĐRL";
        assertEquals(expected, redactor.redact(raw));
    }
}
