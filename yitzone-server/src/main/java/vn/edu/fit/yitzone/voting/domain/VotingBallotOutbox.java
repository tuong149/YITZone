package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

/**
 * Secret ballot outbox buffer (contains NO userId to preserve ballot anonymity per HLD 3.9 / LLD 3.1).
 */
@Document(collection = "VOTING_BALLOT_OUTBOX")
public class VotingBallotOutbox {
    @Id
    private String id = UUID.randomUUID().toString();
    private String campaignId;
    private String candidateId;
    private String receiptHash;
    private Instant flushEligibleAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public String getReceiptHash() { return receiptHash; }
    public void setReceiptHash(String receiptHash) { this.receiptHash = receiptHash; }
    public Instant getFlushEligibleAt() { return flushEligibleAt; }
    public void setFlushEligibleAt(Instant flushEligibleAt) { this.flushEligibleAt = flushEligibleAt; }
}
