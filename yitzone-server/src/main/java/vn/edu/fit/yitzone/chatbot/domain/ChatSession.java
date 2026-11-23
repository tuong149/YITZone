package vn.edu.fit.yitzone.chatbot.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * YITBot conversation session capped at 50 messages per session with BCH escalation flag (UC-BOT-01, UC-BOT-02, UC-BOT-04).
 */
@Document(collection = "CHAT_SESSIONS")
public class ChatSession {
    @Id
    private String id;

    @Indexed
    private String userId;

    private int messageCount = 0;
    private List<ChatMessage> messages = new ArrayList<>();
    private boolean escalatedToStaff = false;
    private String escalatedConversationId;
    private Instant updatedAt = Instant.now();

    public enum MessageRole {
        USER, ASSISTANT
    }

    public record Citation(
            String documentId,
            String sourceTitle,
            String articleSection
    ) {
    }

    public record ChatMessage(
            MessageRole role,
            String content,
            List<Citation> citations,
            List<String> toolCalls,
            Instant timestamp
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public int getMessageCount() { return messageCount; }
    public void setMessageCount(int messageCount) { this.messageCount = messageCount; }
    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
    public boolean isEscalatedToStaff() { return escalatedToStaff; }
    public void setEscalatedToStaff(boolean escalatedToStaff) { this.escalatedToStaff = escalatedToStaff; }
    public String getEscalatedConversationId() { return escalatedConversationId; }
    public void setEscalatedConversationId(String escalatedConversationId) { this.escalatedConversationId = escalatedConversationId; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
