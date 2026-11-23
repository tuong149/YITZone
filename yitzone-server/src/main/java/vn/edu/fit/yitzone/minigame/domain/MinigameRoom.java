package vn.edu.fit.yitzone.minigame.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Live hall interactive minigame room with 6-digit PIN, server-bounded scoring, and streak recovery (UC-GAME-01, UC-GAME-02).
 */
@Document(collection = "MINIGAME_ROOMS")
public class MinigameRoom {
    @Id
    private String id;

    @Indexed(unique = true)
    private String pinCode;

    private String quizId;
    private String eventId;
    private String hostUserId;
    private boolean allowGuests = false;
    private int currentQuestionIndex = -1;
    private List<RoomParticipant> participants = new ArrayList<>();
    private RoomStatus status = RoomStatus.LOBBY;
    private Instant startedAt;
    private Instant finishedAt;

    public enum RoomStatus {
        LOBBY, QUESTION_ACTIVE, QUESTION_CLOSED, LEADERBOARD, FINISHED
    }

    public record RoomParticipant(
            String userId,
            String studentCode,
            String fullName,
            int currentScore,
            int streak,
            boolean connected
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getHostUserId() { return hostUserId; }
    public void setHostUserId(String hostUserId) { this.hostUserId = hostUserId; }
    public boolean isAllowGuests() { return allowGuests; }
    public void setAllowGuests(boolean allowGuests) { this.allowGuests = allowGuests; }
    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int currentQuestionIndex) { this.currentQuestionIndex = currentQuestionIndex; }
    public List<RoomParticipant> getParticipants() { return participants; }
    public void setParticipants(List<RoomParticipant> participants) { this.participants = participants; }
    public RoomStatus getStatus() { return status; }
    public void setStatus(RoomStatus status) { this.status = status; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }
}
