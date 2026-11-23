package vn.edu.fit.yitzone.exam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Proctored 4-option MCQ exam configuration and question pool (UC-EXAM-01).
 */
@Document(collection = "EVENT_EXAMS")
public class EventExam {
    @Id
    private String id;

    @Indexed
    private String eventId;

    private String title;
    private Instant openTime;
    private Instant closeTime;
    private int durationMinutes;
    private int totalQuestionsToDraw;
    private DifficultyDistribution difficultyDistribution;
    private int maxAttemptsAllowed = 1;
    private int maxViolationsAllowed = 3;
    private boolean requireEventCheckin = false;
    private boolean desktopRequired = false;
    private double minPassScorePercent = 50.0;
    private List<ExamQuestion> questionPool = new ArrayList<>();
    private ExamStatus status = ExamStatus.DRAFT;
    private String createdBy;

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    public enum ExamStatus {
        DRAFT, PUBLISHED, ONGOING, CLOSED
    }

    public record DifficultyDistribution(
            int easyCount,
            int mediumCount,
            int hardCount
    ) {
    }

    public record ExamQuestion(
            String questionId,
            String content,
            List<String> options,
            int correctIndex,
            Difficulty difficulty
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Instant getOpenTime() { return openTime; }
    public void setOpenTime(Instant openTime) { this.openTime = openTime; }
    public Instant getCloseTime() { return closeTime; }
    public void setCloseTime(Instant closeTime) { this.closeTime = closeTime; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public int getTotalQuestionsToDraw() { return totalQuestionsToDraw; }
    public void setTotalQuestionsToDraw(int totalQuestionsToDraw) { this.totalQuestionsToDraw = totalQuestionsToDraw; }
    public DifficultyDistribution getDifficultyDistribution() { return difficultyDistribution; }
    public void setDifficultyDistribution(DifficultyDistribution difficultyDistribution) { this.difficultyDistribution = difficultyDistribution; }
    public int getMaxAttemptsAllowed() { return maxAttemptsAllowed; }
    public void setMaxAttemptsAllowed(int maxAttemptsAllowed) { this.maxAttemptsAllowed = maxAttemptsAllowed; }
    public int getMaxViolationsAllowed() { return maxViolationsAllowed; }
    public void setMaxViolationsAllowed(int maxViolationsAllowed) { this.maxViolationsAllowed = maxViolationsAllowed; }
    public boolean isRequireEventCheckin() { return requireEventCheckin; }
    public void setRequireEventCheckin(boolean requireEventCheckin) { this.requireEventCheckin = requireEventCheckin; }
    public boolean isDesktopRequired() { return desktopRequired; }
    public void setDesktopRequired(boolean desktopRequired) { this.desktopRequired = desktopRequired; }
    public double getMinPassScorePercent() { return minPassScorePercent; }
    public void setMinPassScorePercent(double minPassScorePercent) { this.minPassScorePercent = minPassScorePercent; }
    public List<ExamQuestion> getQuestionPool() { return questionPool; }
    public void setQuestionPool(List<ExamQuestion> questionPool) { this.questionPool = questionPool; }
    public ExamStatus getStatus() { return status; }
    public void setStatus(ExamStatus status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
