package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Live voting, resolution polling, and personnel election campaign (UC-VOTE-01..05).
 */
@Document(collection = "VOTING_CAMPAIGNS")
@CompoundIndex(name = "idx_voting_event_status", def = "{'eventId': 1, 'status': 1}")
public class VotingCampaign {
    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String pinCode;

    private String eventId;
    private String targetUnitId;
    private String title;
    private String description;
    private VotingType votingType = VotingType.EVENT_CONTEST_VOTE;
    private BallotRule ballotRule = BallotRule.SINGLE_CHOICE;
    private int minChoicesK = 1;
    private int maxChoicesK = 1;
    private boolean secretBallot = true;
    private boolean allowVoteChange = false;
    private boolean allowKioskBarcode = false;
    private String campaignReceiptSalt;
    private EligibilityRule eligibilityRule = EligibilityRule.CHECKED_IN_EVENT_ONLY;
    private List<String> allowedDelegateUserIds = new ArrayList<>();
    private boolean blockDuplicateDeviceToken = true;
    private ScoringWeights scoringWeights = new ScoringWeights(0, 100);
    private List<String> judgeUserIds = new ArrayList<>();
    private int freezeBeforeEndMinutes = 0;
    private boolean frozenOnStage = false;
    private int totalVotersCast = 0;
    private List<Candidate> candidates = new ArrayList<>();
    private Instant startTime;
    private Instant endTime;
    private CampaignStatus status = CampaignStatus.DRAFT;
    private String createdBy;
    private Instant createdAt = Instant.now();

    public enum VotingType {
        EVENT_CONTEST_VOTE, RESOLUTION_POLL, PERSONNEL_ELECTION
    }

    public enum BallotRule {
        SINGLE_CHOICE, MULTI_CHOICE_MAX_K, MULTI_CHOICE_EXACT_K, YES_NO_ABSTAIN
    }

    public enum EligibilityRule {
        CHECKED_IN_EVENT_ONLY, FACULTY_STUDENTS, UNIT_MEMBERS_ONLY, DELEGATE_LIST_ONLY
    }

    public enum CampaignStatus {
        DRAFT, OPEN, FROZEN, CLOSED, PUBLISHED
    }

    public record ScoringWeights(
            int judgeWeightPercent,
            int audienceWeightPercent
    ) {
    }

    public record Candidate(
            String candidateId,
            String code,
            String name,
            String avatarUrl,
            String description,
            String linkedPerformanceActId,
            int audienceVoteCount,
            Instant lastVoteReachedAt, // NULL when secretBallot == true
            Double judgeAvgScore,
            Double finalWeightedScore,
            Integer finalRank,
            boolean tiedRequiringRunoff
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getTargetUnitId() { return targetUnitId; }
    public void setTargetUnitId(String targetUnitId) { this.targetUnitId = targetUnitId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public VotingType getVotingType() { return votingType; }
    public void setVotingType(VotingType votingType) { this.votingType = votingType; }
    public BallotRule getBallotRule() { return ballotRule; }
    public void setBallotRule(BallotRule ballotRule) { this.ballotRule = ballotRule; }
    public int getMinChoicesK() { return minChoicesK; }
    public void setMinChoicesK(int minChoicesK) { this.minChoicesK = minChoicesK; }
    public int getMaxChoicesK() { return maxChoicesK; }
    public void setMaxChoicesK(int maxChoicesK) { this.maxChoicesK = maxChoicesK; }
    public boolean isSecretBallot() { return secretBallot; }
    public void setSecretBallot(boolean secretBallot) { this.secretBallot = secretBallot; }
    public boolean isAllowVoteChange() { return allowVoteChange; }
    public void setAllowVoteChange(boolean allowVoteChange) { this.allowVoteChange = allowVoteChange; }
    public boolean isAllowKioskBarcode() { return allowKioskBarcode; }
    public void setAllowKioskBarcode(boolean allowKioskBarcode) { this.allowKioskBarcode = allowKioskBarcode; }
    public String getCampaignReceiptSalt() { return campaignReceiptSalt; }
    public void setCampaignReceiptSalt(String campaignReceiptSalt) { this.campaignReceiptSalt = campaignReceiptSalt; }
    public EligibilityRule getEligibilityRule() { return eligibilityRule; }
    public void setEligibilityRule(EligibilityRule eligibilityRule) { this.eligibilityRule = eligibilityRule; }
    public List<String> getAllowedDelegateUserIds() { return allowedDelegateUserIds; }
    public void setAllowedDelegateUserIds(List<String> allowedDelegateUserIds) { this.allowedDelegateUserIds = allowedDelegateUserIds; }
    public boolean isBlockDuplicateDeviceToken() { return blockDuplicateDeviceToken; }
    public void setBlockDuplicateDeviceToken(boolean blockDuplicateDeviceToken) { this.blockDuplicateDeviceToken = blockDuplicateDeviceToken; }
    public ScoringWeights getScoringWeights() { return scoringWeights; }
    public void setScoringWeights(ScoringWeights scoringWeights) { this.scoringWeights = scoringWeights; }
    public List<String> getJudgeUserIds() { return judgeUserIds; }
    public void setJudgeUserIds(List<String> judgeUserIds) { this.judgeUserIds = judgeUserIds; }
    public int getFreezeBeforeEndMinutes() { return freezeBeforeEndMinutes; }
    public void setFreezeBeforeEndMinutes(int freezeBeforeEndMinutes) { this.freezeBeforeEndMinutes = freezeBeforeEndMinutes; }
    public boolean isFrozenOnStage() { return frozenOnStage; }
    public void setFrozenOnStage(boolean frozenOnStage) { this.frozenOnStage = frozenOnStage; }
    public int getTotalVotersCast() { return totalVotersCast; }
    public void setTotalVotersCast(int totalVotersCast) { this.totalVotersCast = totalVotersCast; }
    public List<Candidate> getCandidates() { return candidates; }
    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public CampaignStatus getStatus() { return status; }
    public void setStatus(CampaignStatus status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
