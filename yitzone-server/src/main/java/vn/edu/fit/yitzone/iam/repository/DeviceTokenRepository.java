package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.DeviceToken;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends MongoRepository<DeviceToken, String> {
    Optional<DeviceToken> findByTokenHashAndRevokedFalse(String tokenHash);
    List<DeviceToken> findByUserIdAndRevokedFalse(String userId);
}
