package vn.edu.fit.yitzone.voting.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "VOTING_CAMPAIGNS")
public class VotingCampaign {
    @Id
    private String id;
    private String eventId;
    private String title;
    private boolean secretBallot = true;
    private List<String> judgeUserIds = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isSecretBallot() { return secretBallot; }
    public void setSecretBallot(boolean secretBallot) { this.secretBallot = secretBallot; }
    public List<String> getJudgeUserIds() { return judgeUserIds; }
    public void setJudgeUserIds(List<String> judgeUserIds) { this.judgeUserIds = judgeUserIds; }
}
