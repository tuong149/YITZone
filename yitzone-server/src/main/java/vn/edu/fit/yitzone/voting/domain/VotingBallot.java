package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Official ballot box (UUIDv4 _id generated on outbox shuffle flush; voterUserId MUST be null for secret ballots) (UC-VOTE-02).
 */
@Document(collection = "VOTING_BALLOTS")
@CompoundIndex(name = "idx_ballot_campaign_voter", def = "{'campaignId': 1, 'voterUserId': 1}")
public class VotingBallot {
    @Id
    private String id = UUID.randomUUID().toString();

    private String campaignId;
    private String voterUserId; // MUST be null when secretBallot == true
    private List<String> selectedCandidateIds = new ArrayList<>();
    private VotingBallotOutbox.ResolutionChoice resolutionChoice;

    @Indexed(unique = true, sparse = true)
    private String ballotReceiptHash;

    private String submittedDateBucket; // YYYY-MM-DD

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getVoterUserId() { return voterUserId; }
    public void setVoterUserId(String voterUserId) { this.voterUserId = voterUserId; }
    public List<String> getSelectedCandidateIds() { return selectedCandidateIds; }
    public void setSelectedCandidateIds(List<String> selectedCandidateIds) { this.selectedCandidateIds = selectedCandidateIds; }
    public VotingBallotOutbox.ResolutionChoice getResolutionChoice() { return resolutionChoice; }
    public void setResolutionChoice(VotingBallotOutbox.ResolutionChoice resolutionChoice) { this.resolutionChoice = resolutionChoice; }
    public String getBallotReceiptHash() { return ballotReceiptHash; }
    public void setBallotReceiptHash(String ballotReceiptHash) { this.ballotReceiptHash = ballotReceiptHash; }
    public String getSubmittedDateBucket() { return submittedDateBucket; }
    public void setSubmittedDateBucket(String submittedDateBucket) { this.submittedDateBucket = submittedDateBucket; }
}
