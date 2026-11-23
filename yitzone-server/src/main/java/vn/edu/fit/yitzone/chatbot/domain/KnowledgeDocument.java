package vn.edu.fit.yitzone.chatbot.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Curated and BTV-approved RAG knowledge base chunk with vector embedding for YITBot (UC-BOT-01, UC-BOT-03).
 */
@Document(collection = "KNOWLEDGE_DOCUMENTS")
public class KnowledgeDocument {
    @Id
    private String id;

    private String sourceTitle;
    private String articleSection;
    private String docVersion;
    private LocalDate effectiveDate;
    private DocumentCategory category = DocumentCategory.REGULATION;
    private String creatorUserId;
    private String approvedBy;
    private Instant approvedAt;
    private String scopeUnitId;
    private String contentChunk;
    private List<Float> embedding = new ArrayList<>();
    private DocumentStatus status = DocumentStatus.DRAFT;

    public enum DocumentCategory {
        REGULATION, FAQ, AWARD_GUIDE, MERCH_GUIDE
    }

    public enum DocumentStatus {
        DRAFT, APPROVED_INDEXED, ARCHIVED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSourceTitle() { return sourceTitle; }
    public void setSourceTitle(String sourceTitle) { this.sourceTitle = sourceTitle; }
    public String getArticleSection() { return articleSection; }
    public void setArticleSection(String articleSection) { this.articleSection = articleSection; }
    public String getDocVersion() { return docVersion; }
    public void setDocVersion(String docVersion) { this.docVersion = docVersion; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
    public DocumentCategory getCategory() { return category; }
    public void setCategory(DocumentCategory category) { this.category = category; }
    public String getCreatorUserId() { return creatorUserId; }
    public void setCreatorUserId(String creatorUserId) { this.creatorUserId = creatorUserId; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }
    public String getScopeUnitId() { return scopeUnitId; }
    public void setScopeUnitId(String scopeUnitId) { this.scopeUnitId = scopeUnitId; }
    public String getContentChunk() { return contentChunk; }
    public void setContentChunk(String contentChunk) { this.contentChunk = contentChunk; }
    public List<Float> getEmbedding() { return embedding; }
    public void setEmbedding(List<Float> embedding) { this.embedding = embedding; }
    public DocumentStatus getStatus() { return status; }
    public void setStatus(DocumentStatus status) { this.status = status; }
}
