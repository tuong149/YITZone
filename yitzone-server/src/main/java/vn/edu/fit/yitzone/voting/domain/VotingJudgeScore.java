package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Identified judge scoring sheet decoupled from audience ballots for full auditability (UC-VOTE-04).
 */
@Document(collection = "VOTING_JUDGE_SCORES")
@CompoundIndex(name = "uq_judge_score_campaign_judge", def = "{'campaignId': 1, 'judgeUserId': 1}", unique = true)
public class VotingJudgeScore {
    @Id
    private String id;

    private String campaignId;
    private String judgeUserId;
    private String judgeNameSnapshot;
    private List<CandidateScore> scores = new ArrayList<>();
    private Instant submittedAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public record CandidateScore(
            String candidateId,
            double score100,
            String note
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getJudgeUserId() { return judgeUserId; }
    public void setJudgeUserId(String judgeUserId) { this.judgeUserId = judgeUserId; }
    public String getJudgeNameSnapshot() { return judgeNameSnapshot; }
    public void setJudgeNameSnapshot(String judgeNameSnapshot) { this.judgeNameSnapshot = judgeNameSnapshot; }
    public List<CandidateScore> getScores() { return scores; }
    public void setScores(List<CandidateScore> scores) { this.scores = scores; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
