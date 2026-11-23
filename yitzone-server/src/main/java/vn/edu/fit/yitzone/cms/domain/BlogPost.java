package vn.edu.fit.yitzone.cms.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Blog and media article with editorial review and scheduled publishing (UC-CMS-01, UC-CMS-02).
 */
@Document(collection = "BLOG_POSTS")
@CompoundIndex(name = "idx_blog_status_scheduled", def = "{'status': 1, 'scheduledPublishAt': 1}")
public class BlogPost {
    @Id
    private String id;

    @TextIndexed
    private String title;

    @Indexed(unique = true)
    private String slug;

    private String content;
    private String coverImageUrl;
    private String authorId;
    private String unitId;
    private PostCategory category;
    private boolean studentContribution = false;

    @TextIndexed
    private List<String> tags = new ArrayList<>();

    private PostStatus status = PostStatus.DRAFT;
    private String editorialNote;
    private String reviewedBy;
    private Instant scheduledPublishAt;
    private Instant publishedAt;
    private int viewCount = 0;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public enum PostCategory {
        UNION_NEWS,
        ACADEMIC_IT,
        INTERNSHIP_RECRUITMENT,
        SV5T_SPOTLIGHT
    }

    public enum PostStatus {
        DRAFT, TEAM_REVIEW, COMMITTEE_REVIEW, PUBLISHED, REJECTED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    public String getUnitId() { return unitId; }
    public void setUnitId(String unitId) { this.unitId = unitId; }
    public PostCategory getCategory() { return category; }
    public void setCategory(PostCategory category) { this.category = category; }
    public boolean isStudentContribution() { return studentContribution; }
    public void setStudentContribution(boolean studentContribution) { this.studentContribution = studentContribution; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public PostStatus getStatus() { return status; }
    public void setStatus(PostStatus status) { this.status = status; }
    public String getEditorialNote() { return editorialNote; }
    public void setEditorialNote(String editorialNote) { this.editorialNote = editorialNote; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public Instant getScheduledPublishAt() { return scheduledPublishAt; }
    public void setScheduledPublishAt(Instant scheduledPublishAt) { this.scheduledPublishAt = scheduledPublishAt; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
