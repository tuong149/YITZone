package vn.edu.fit.yitzone.privacy.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.privacy.domain.DataPrivacyRequest;

import java.util.List;

public interface DataPrivacyRequestRepository extends MongoRepository<DataPrivacyRequest, String> {
    List<DataPrivacyRequest> findByUserIdOrderByRequestedAtDesc(String userId);
    List<DataPrivacyRequest> findByStatusOrderByRequestedAtAsc(DataPrivacyRequest.RequestStatus status);
}
