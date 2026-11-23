package vn.edu.fit.yitzone.minigame.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Minigame question bank (UC-GAME-01: single choice, multi-choice, true/false).
 */
@Document(collection = "QUIZZES")
public class Quiz {
    @Id
    private String id;

    private String title;
    private String createdBy;
    private List<QuizQuestion> questions = new ArrayList<>();
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public enum QuestionType {
        SINGLE_CHOICE, MULTI_CHOICE, TRUE_FALSE
    }

    public record QuizQuestion(
            String questionId,
            QuestionType questionType,
            String content,
            List<String> options,
            List<Integer> correctIndices,
            int timeLimitSec,
            int basePoints
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public List<QuizQuestion> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestion> questions) { this.questions = questions; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
