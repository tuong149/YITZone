package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Secret ballot outbox buffer (UUIDv4 _id, contains NO userId to preserve ballot anonymity per HLD 3.9 / LLD 3.1 / UC-VOTE-02).
 */
@Document(collection = "VOTING_BALLOT_OUTBOX")
public class VotingBallotOutbox {
    @Id
    private String id = UUID.randomUUID().toString();

    @Indexed
    private String campaignId;

    private String candidateId;
    private List<String> selectedCandidateIds = new ArrayList<>();
    private ResolutionChoice resolutionChoice;

    @Indexed(unique = true, sparse = true)
    private String receiptHash;

    private String submittedDateBucket; // YYYY-MM-DD
    private Instant flushEligibleAt;

    public enum ResolutionChoice {
        YES, NO, ABSTAIN
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public List<String> getSelectedCandidateIds() { return selectedCandidateIds; }
    public void setSelectedCandidateIds(List<String> selectedCandidateIds) { this.selectedCandidateIds = selectedCandidateIds; }
    public ResolutionChoice getResolutionChoice() { return resolutionChoice; }
    public void setResolutionChoice(ResolutionChoice resolutionChoice) { this.resolutionChoice = resolutionChoice; }
    public String getReceiptHash() { return receiptHash; }
    public void setReceiptHash(String receiptHash) { this.receiptHash = receiptHash; }
    public String getSubmittedDateBucket() { return submittedDateBucket; }
    public void setSubmittedDateBucket(String submittedDateBucket) { this.submittedDateBucket = submittedDateBucket; }
    public Instant getFlushEligibleAt() { return flushEligibleAt; }
    public void setFlushEligibleAt(Instant flushEligibleAt) { this.flushEligibleAt = flushEligibleAt; }
}
