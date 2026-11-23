package vn.edu.fit.yitzone.qachat.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Direct student-to-BCH Q&A Messenger conversation thread with atomic claim and 24h SLA escalation (UC-QACHAT-01..03).
 */
@Document(collection = "QA_CONVERSATIONS")
@CompoundIndexes({
        @CompoundIndex(name = "idx_qachat_student_updated", def = "{'studentId': 1, 'updatedAt': -1}"),
        @CompoundIndex(name = "idx_qachat_sla_monitor", def = "{'status': 1, 'slaBreachedAt': 1, 'slaDeadlineAt': 1}"),
        @CompoundIndex(name = "idx_qachat_inbox_cat_updated", def = "{'status': 1, 'categoryTag': 1, 'updatedAt': -1}"),
        @CompoundIndex(name = "idx_qachat_assigned_status_updated", def = "{'assignedBchUserId': 1, 'status': 1, 'updatedAt': -1}")
})
public class QaConversation {
    @Id
    private String id;

    @Indexed(unique = true)
    private String conversationCode;

    private String studentId;
    private StudentSnapshot studentSnapshot;
    private CategoryTag categoryTag = CategoryTag.GENERAL;
    private String subject;
    private String handoffBotSessionId;
    private String assignedBchUserId;
    private String assignedBchNameSnapshot;
    private LastMessagePreview lastMessagePreview;

    private int unreadByStudentCount = 0;
    private int unreadByBchCount = 0;
    private Instant studentLastReadAt;
    private Instant bchLastReadAt;
    private Instant firstResponseAt;
    private Instant slaDeadlineAt;
    private Instant slaBreachedAt;
    private Instant escalatedToBtvAt;

    private ConversationStatus status = ConversationStatus.OPEN;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private Instant resolvedAt;

    public enum CategoryTag {
        ATTENDANCE_CERT,
        SV5T_AWARD,
        EVENT_BTC,
        STORE_ORDER,
        OFFICE_DUTY,
        OJ_CONTEST,
        GENERAL
    }

    public enum ConversationStatus {
        OPEN, IN_PROGRESS, RESOLVED, REOPENED
    }

    public record StudentSnapshot(
            String fullName,
            String studentCode,
            String className,
            String majorCode
    ) {
    }

    public record LastMessagePreview(
            String senderId,
            QaMessage.SenderType senderType,
            String previewText,
            Instant sentAt
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getConversationCode() { return conversationCode; }
    public void setConversationCode(String conversationCode) { this.conversationCode = conversationCode; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public StudentSnapshot getStudentSnapshot() { return studentSnapshot; }
    public void setStudentSnapshot(StudentSnapshot studentSnapshot) { this.studentSnapshot = studentSnapshot; }
    public CategoryTag getCategoryTag() { return categoryTag; }
    public void setCategoryTag(CategoryTag categoryTag) { this.categoryTag = categoryTag; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getHandoffBotSessionId() { return handoffBotSessionId; }
    public void setHandoffBotSessionId(String handoffBotSessionId) { this.handoffBotSessionId = handoffBotSessionId; }
    public String getAssignedBchUserId() { return assignedBchUserId; }
    public void setAssignedBchUserId(String assignedBchUserId) { this.assignedBchUserId = assignedBchUserId; }
    public String getAssignedBchNameSnapshot() { return assignedBchNameSnapshot; }
    public void setAssignedBchNameSnapshot(String assignedBchNameSnapshot) { this.assignedBchNameSnapshot = assignedBchNameSnapshot; }
    public LastMessagePreview getLastMessagePreview() { return lastMessagePreview; }
    public void setLastMessagePreview(LastMessagePreview lastMessagePreview) { this.lastMessagePreview = lastMessagePreview; }
    public int getUnreadByStudentCount() { return unreadByStudentCount; }
    public void setUnreadByStudentCount(int unreadByStudentCount) { this.unreadByStudentCount = unreadByStudentCount; }
    public int getUnreadByBchCount() { return unreadByBchCount; }
    public void setUnreadByBchCount(int unreadByBchCount) { this.unreadByBchCount = unreadByBchCount; }
    public Instant getStudentLastReadAt() { return studentLastReadAt; }
    public void setStudentLastReadAt(Instant studentLastReadAt) { this.studentLastReadAt = studentLastReadAt; }
    public Instant getBchLastReadAt() { return bchLastReadAt; }
    public void setBchLastReadAt(Instant bchLastReadAt) { this.bchLastReadAt = bchLastReadAt; }
    public Instant getFirstResponseAt() { return firstResponseAt; }
    public void setFirstResponseAt(Instant firstResponseAt) { this.firstResponseAt = firstResponseAt; }
    public Instant getSlaDeadlineAt() { return slaDeadlineAt; }
    public void setSlaDeadlineAt(Instant slaDeadlineAt) { this.slaDeadlineAt = slaDeadlineAt; }
    public Instant getSlaBreachedAt() { return slaBreachedAt; }
    public void setSlaBreachedAt(Instant slaBreachedAt) { this.slaBreachedAt = slaBreachedAt; }
    public Instant getEscalatedToBtvAt() { return escalatedToBtvAt; }
    public void setEscalatedToBtvAt(Instant escalatedToBtvAt) { this.escalatedToBtvAt = escalatedToBtvAt; }
    public ConversationStatus getStatus() { return status; }
    public void setStatus(ConversationStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
