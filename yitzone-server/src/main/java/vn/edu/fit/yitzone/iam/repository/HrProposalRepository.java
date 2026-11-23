package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.HrProposal;

import java.util.Collection;
import java.util.List;

public interface HrProposalRepository extends MongoRepository<HrProposal, String> {
    List<HrProposal> findByUnitIdAndStatusOrderByCreatedAtDesc(String unitId, HrProposal.ProposalStatus status);
    List<HrProposal> findByUnitIdOrderByCreatedAtDesc(String unitId);
    List<HrProposal> findByUnitIdInAndStatusOrderByCreatedAtDesc(Collection<String> unitIds, HrProposal.ProposalStatus status);
}
