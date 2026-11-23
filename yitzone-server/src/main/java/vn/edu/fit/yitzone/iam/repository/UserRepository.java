package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.User;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByStudentCode(String studentCode);
    Optional<User> findByPersonalEmailAndPersonalEmailVerifiedTrue(String personalEmail);
    boolean existsByEmail(String email);
    List<User> findByRoleScopesUnitId(String unitId);
    List<User> findByRoleScopesUnitIdIn(Collection<String> unitIds);
}
