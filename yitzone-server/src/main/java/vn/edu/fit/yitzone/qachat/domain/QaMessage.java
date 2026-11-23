package vn.edu.fit.yitzone.qachat.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Message in a Q&A Messenger conversation, supporting student-hidden internal BCH notes (UC-QACHAT-01, UC-QACHAT-02).
 */
@Document(collection = "QA_MESSAGES")
@CompoundIndex(name = "idx_qamsg_conv_internal_created", def = "{'conversationId': 1, 'internalNote': 1, 'createdAt': -1}")
public class QaMessage {
    @Id
    private String id;

    private String conversationId;
    private String senderId;
    private SenderType senderType;
    private String senderDisplayBadge;
    private MessageType messageType = MessageType.TEXT;
    private String content;
    private List<Attachment> attachments = new ArrayList<>();
    private String replyToMessageId;
    private boolean internalNote = false;
    private Instant createdAt = Instant.now();

    public enum SenderType {
        STUDENT, BCH_STAFF, SYSTEM_EVENT
    }

    public enum MessageType {
        TEXT, IMAGE, FILE, INTERNAL_NOTE, SYSTEM_LOG
    }

    public record Attachment(
            String fileName,
            String fileUrl,
            String fileType,
            long fileSize
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public SenderType getSenderType() { return senderType; }
    public void setSenderType(SenderType senderType) { this.senderType = senderType; }
    public String getSenderDisplayBadge() { return senderDisplayBadge; }
    public void setSenderDisplayBadge(String senderDisplayBadge) { this.senderDisplayBadge = senderDisplayBadge; }
    public MessageType getMessageType() { return messageType; }
    public void setMessageType(MessageType messageType) { this.messageType = messageType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public List<Attachment> getAttachments() { return attachments; }
    public void setAttachments(List<Attachment> attachments) { this.attachments = attachments; }
    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }
    public boolean isInternalNote() { return internalNote; }
    public void setInternalNote(boolean internalNote) { this.internalNote = internalNote; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
