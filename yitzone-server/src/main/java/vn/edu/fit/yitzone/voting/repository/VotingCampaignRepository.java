package vn.edu.fit.yitzone.voting.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.voting.domain.VotingCampaign;

public interface VotingCampaignRepository extends MongoRepository<VotingCampaign, String> {
}
