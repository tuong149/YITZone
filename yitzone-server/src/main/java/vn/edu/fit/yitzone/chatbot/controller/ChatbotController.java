package vn.edu.fit.yitzone.chatbot.controller;

import jakarta.annotation.PreDestroy;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import vn.edu.fit.yitzone.chatbot.service.PiiRedactorService;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/chatbot")
public class ChatbotController {
    private final PiiRedactorService piiRedactorService;
    private final ExecutorService sseVirtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();

    public ChatbotController(PiiRedactorService piiRedactorService) {
        this.piiRedactorService = piiRedactorService;
    }

    @PreDestroy
    public void shutdownExecutor() {
        sseVirtualThreadExecutor.close();
    }

    /**
     * POST-only SSE stream prevents leaking PII/prompts and JWT tokens in GET query strings & proxy access logs (ISS-09).
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamReply(@Valid @RequestBody ChatStreamRequest request) {
        SseEmitter emitter = new SseEmitter(30_000L);
        String sanitizedPrompt = piiRedactorService.redact(request.message());
        sseVirtualThreadExecutor.execute(() -> {
            try {
                emitter.send(SseEmitter.event().name("chunk").data("YITBot đã tiếp nhận câu hỏi (đã khử PII): " + sanitizedPrompt));
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    public record ChatStreamRequest(
            String sessionId,
            @NotBlank @Size(max = 2000) String message
    ) {}
}
