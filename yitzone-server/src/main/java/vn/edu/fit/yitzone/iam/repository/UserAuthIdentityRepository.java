package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;

import java.util.Optional;

public interface UserAuthIdentityRepository extends MongoRepository<UserAuthIdentity, String> {
    Optional<UserAuthIdentity> findByGoogleSub(String googleSub);
    Optional<UserAuthIdentity> findByEmail(String email);
    Optional<UserAuthIdentity> findByUserId(String userId);
    boolean existsByEmail(String email);
}
