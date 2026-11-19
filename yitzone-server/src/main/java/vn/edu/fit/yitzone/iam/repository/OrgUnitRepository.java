package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;

import java.util.Optional;

public interface OrgUnitRepository extends MongoRepository<OrgUnit, String> {
    Optional<OrgUnit> findByCode(String code);
}
