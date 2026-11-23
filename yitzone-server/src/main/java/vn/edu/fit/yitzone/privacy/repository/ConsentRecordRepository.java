package vn.edu.fit.yitzone.privacy.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.privacy.domain.ConsentRecord;

import java.util.List;
import java.util.Optional;

public interface ConsentRecordRepository extends MongoRepository<ConsentRecord, String> {
    Optional<ConsentRecord> findByUserIdAndConsentTypeAndPolicyVersion(
            String userId,
            ConsentRecord.ConsentType consentType,
            String policyVersion
    );
    List<ConsentRecord> findByUserIdOrderByGrantedAtDesc(String userId);
}
