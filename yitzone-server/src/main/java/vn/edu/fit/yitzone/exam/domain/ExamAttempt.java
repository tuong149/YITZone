package vn.edu.fit.yitzone.exam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Student proctored exam attempt bound to a single ECDSA P-256 device token with transfer & violation logs (UC-EXAM-02, UC-EXAM-03).
 */
@Document(collection = "EXAM_ATTEMPTS")
@CompoundIndex(name = "uq_exam_attempt_exam_user", def = "{'examId': 1, 'userId': 1}", unique = true)
public class ExamAttempt {
    @Id
    private String id;

    private String examId;
    private String userId;
    private String deviceTokenId;
    private DeviceType deviceType = DeviceType.DESKTOP;
    private List<DeviceTransfer> deviceTransfers = new ArrayList<>();
    private List<AssignedQuestion> assignedQuestions = new ArrayList<>();
    private Instant startedAt = Instant.now();
    private Instant expiresAt;
    private Instant submittedAt;
    private Integer timeSpentSeconds;
    private Double finalScore;
    private int violationCount = 0;
    private List<ViolationLog> violationLogs = new ArrayList<>();
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    public enum DeviceType {
        DESKTOP, MOBILE
    }

    public enum ViolationType {
        TAB_SWITCH, FULLSCREEN_EXIT, BLUR, HEARTBEAT_GAP
    }

    public enum ViolationAction {
        WARNING, LOG_ONLY, FORCED_SUBMITTED
    }

    public enum AttemptStatus {
        IN_PROGRESS, SUBMITTED, FORCED_SUBMITTED, DISQUALIFIED
    }

    public record DeviceTransfer(
            String fromDeviceTokenId,
            String toDeviceTokenId,
            String proctorId,
            String reason,
            Instant transferredAt
    ) {
    }

    public record AssignedQuestion(
            String questionId,
            List<Integer> shuffledOptionMapping,
            Integer selectedIndex
    ) {
    }

    public record ViolationLog(
            ViolationType type,
            DeviceType deviceType,
            ViolationAction actionTaken,
            Integer gapSeconds,
            Instant timestamp
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getDeviceTokenId() { return deviceTokenId; }
    public void setDeviceTokenId(String deviceTokenId) { this.deviceTokenId = deviceTokenId; }
    public DeviceType getDeviceType() { return deviceType; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }
    public List<DeviceTransfer> getDeviceTransfers() { return deviceTransfers; }
    public void setDeviceTransfers(List<DeviceTransfer> deviceTransfers) { this.deviceTransfers = deviceTransfers; }
    public List<AssignedQuestion> getAssignedQuestions() { return assignedQuestions; }
    public void setAssignedQuestions(List<AssignedQuestion> assignedQuestions) { this.assignedQuestions = assignedQuestions; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public Double getFinalScore() { return finalScore; }
    public void setFinalScore(Double finalScore) { this.finalScore = finalScore; }
    public int getViolationCount() { return violationCount; }
    public void setViolationCount(int violationCount) { this.violationCount = violationCount; }
    public List<ViolationLog> getViolationLogs() { return violationLogs; }
    public void setViolationLogs(List<ViolationLog> violationLogs) { this.violationLogs = violationLogs; }
    public AttemptStatus getStatus() { return status; }
    public void setStatus(AttemptStatus status) { this.status = status; }
}
