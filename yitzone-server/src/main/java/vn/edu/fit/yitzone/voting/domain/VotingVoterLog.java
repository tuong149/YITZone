package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

/**
 * 1-voter-1-ballot lock using UUIDv4 _id (no ObjectId timestamp) and null votedAt for secret ballots (UC-VOTE-02, UC-VOTE-03).
 */
@Document(collection = "VOTING_VOTER_LOGS")
@CompoundIndexes({
        @CompoundIndex(name = "uq_voter_log_campaign_user", def = "{'campaignId': 1, 'userId': 1}", unique = true),
        @CompoundIndex(name = "idx_voter_log_campaign_device", def = "{'campaignId': 1, 'verifiedDeviceTokenId': 1}")
})
public class VotingVoterLog {
    @Id
    private String id = UUID.randomUUID().toString();

    private String campaignId;
    private String userId;
    private CheckinVerifySource checkinVerifySource;
    private String verifiedDeviceTokenId;
    private String votedDateBucket; // YYYY-MM-DD
    private Instant votedAt;        // MUST be null when VotingCampaign.secretBallot == true

    public enum CheckinVerifySource {
        EVENT_ATTENDANCE, KIOSK_BARCODE_1D, ROLE_SCOPE, DELEGATE_LIST
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public CheckinVerifySource getCheckinVerifySource() { return checkinVerifySource; }
    public void setCheckinVerifySource(CheckinVerifySource checkinVerifySource) { this.checkinVerifySource = checkinVerifySource; }
    public String getVerifiedDeviceTokenId() { return verifiedDeviceTokenId; }
    public void setVerifiedDeviceTokenId(String verifiedDeviceTokenId) { this.verifiedDeviceTokenId = verifiedDeviceTokenId; }
    public String getVotedDateBucket() { return votedDateBucket; }
    public void setVotedDateBucket(String votedDateBucket) { this.votedDateBucket = votedDateBucket; }
    public Instant getVotedAt() { return votedAt; }
    public void setVotedAt(Instant votedAt) { this.votedAt = votedAt; }
}
