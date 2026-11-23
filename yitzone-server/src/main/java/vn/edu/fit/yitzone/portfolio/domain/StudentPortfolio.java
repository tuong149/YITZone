package vn.edu.fit.yitzone.portfolio.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Student E-Portfolio & verifiable CV profile (default PRIVATE, independent QR verification token) (UC-PORT-01..03).
 */
@Document(collection = "STUDENT_PORTFOLIOS")
public class StudentPortfolio {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Indexed(unique = true, sparse = true)
    private String studentCode;

    @Indexed(unique = true, sparse = true)
    private String customSlug;

    private Visibility visibility = Visibility.PRIVATE;
    private String headline;
    private String bio;
    private List<String> techSkills = new ArrayList<>();
    private SocialLinks socialLinks;
    private List<PersonalProject> personalProjects = new ArrayList<>();
    private List<String> pinnedParticipationIds = new ArrayList<>();
    private List<String> hiddenParticipationIds = new ArrayList<>();
    private VerifiedStatsSnapshot verifiedStatsSnapshot;
    private CvTemplateStyle cvTemplateStyle = CvTemplateStyle.MODERN_TECH;

    @Indexed(unique = true, sparse = true)
    private String verificationToken;

    private String latestGeneratedCvPdfUrl;
    private List<ModerationHiddenItem> moderationHiddenItems = new ArrayList<>();
    private Instant updatedAt = Instant.now();

    public enum Visibility {
        PUBLIC, UNLISTED_LINK, PRIVATE
    }

    public enum CvTemplateStyle {
        MODERN_TECH, ACADEMIC_RESEARCH, ATS_MINIMALIST
    }

    public record SocialLinks(
            String githubUrl,
            String linkedinUrl,
            String personalWebsiteUrl,
            String contactEmail
    ) {
    }

    public record PersonalProject(
            String projectId,
            String title,
            String role,
            String description,
            List<String> techStack,
            String githubRepoUrl,
            String liveDemoUrl,
            LocalDate startDate,
            LocalDate endDate
    ) {
    }

    public record VerifiedStatsSnapshot(
            int totalCddnEvents,
            int totalOrganizerEvents,
            int ojSolvedEasy,
            int ojSolvedMedium,
            int ojSolvedHard,
            Integer topContestRank,
            List<String> verifiedAwards
    ) {
    }

    public record ModerationHiddenItem(
            String sectionType,
            String targetItemId,
            String reason,
            String hiddenBy,
            Instant hiddenAt
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }
    public String getCustomSlug() { return customSlug; }
    public void setCustomSlug(String customSlug) { this.customSlug = customSlug; }
    public Visibility getVisibility() { return visibility; }
    public void setVisibility(Visibility visibility) { this.visibility = visibility; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public List<String> getTechSkills() { return techSkills; }
    public void setTechSkills(List<String> techSkills) { this.techSkills = techSkills; }
    public SocialLinks getSocialLinks() { return socialLinks; }
    public void setSocialLinks(SocialLinks socialLinks) { this.socialLinks = socialLinks; }
    public List<PersonalProject> getPersonalProjects() { return personalProjects; }
    public void setPersonalProjects(List<PersonalProject> personalProjects) { this.personalProjects = personalProjects; }
    public List<String> getPinnedParticipationIds() { return pinnedParticipationIds; }
    public void setPinnedParticipationIds(List<String> pinnedParticipationIds) { this.pinnedParticipationIds = pinnedParticipationIds; }
    public List<String> getHiddenParticipationIds() { return hiddenParticipationIds; }
    public void setHiddenParticipationIds(List<String> hiddenParticipationIds) { this.hiddenParticipationIds = hiddenParticipationIds; }
    public VerifiedStatsSnapshot getVerifiedStatsSnapshot() { return verifiedStatsSnapshot; }
    public void setVerifiedStatsSnapshot(VerifiedStatsSnapshot verifiedStatsSnapshot) { this.verifiedStatsSnapshot = verifiedStatsSnapshot; }
    public CvTemplateStyle getCvTemplateStyle() { return cvTemplateStyle; }
    public void setCvTemplateStyle(CvTemplateStyle cvTemplateStyle) { this.cvTemplateStyle = cvTemplateStyle; }
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    public String getLatestGeneratedCvPdfUrl() { return latestGeneratedCvPdfUrl; }
    public void setLatestGeneratedCvPdfUrl(String latestGeneratedCvPdfUrl) { this.latestGeneratedCvPdfUrl = latestGeneratedCvPdfUrl; }
    public List<ModerationHiddenItem> getModerationHiddenItems() { return moderationHiddenItems; }
    public void setModerationHiddenItems(List<ModerationHiddenItem> moderationHiddenItems) { this.moderationHiddenItems = moderationHiddenItems; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
