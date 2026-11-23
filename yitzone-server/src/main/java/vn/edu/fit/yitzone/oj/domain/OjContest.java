package vn.edu.fit.yitzone.oj.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Online Judge programming contest supporting ICPC and IOI scoring rules (UC-OJ-03).
 */
@Document(collection = "OJ_CONTESTS")
public class OjContest {
    @Id
    private String id;

    private String title;
    private Instant startTime;
    private Instant endTime;
    private int freezeTimeMinutes = 60;
    private ScoringRule scoringRule = ScoringRule.ICPC;
    private List<String> problemIds = new ArrayList<>();
    private String createdBy;
    private ContestStatus status = ContestStatus.UPCOMING;

    public enum ScoringRule {
        ICPC, IOI
    }

    public enum ContestStatus {
        UPCOMING, ONGOING, FROZEN, ENDED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public int getFreezeTimeMinutes() { return freezeTimeMinutes; }
    public void setFreezeTimeMinutes(int freezeTimeMinutes) { this.freezeTimeMinutes = freezeTimeMinutes; }
    public ScoringRule getScoringRule() { return scoringRule; }
    public void setScoringRule(ScoringRule scoringRule) { this.scoringRule = scoringRule; }
    public List<String> getProblemIds() { return problemIds; }
    public void setProblemIds(List<String> problemIds) { this.problemIds = problemIds; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public ContestStatus getStatus() { return status; }
    public void setStatus(ContestStatus status) { this.status = status; }
}
