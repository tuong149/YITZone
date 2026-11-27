package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionCatalog;

import java.util.List;
import java.util.Optional;

public interface ExecutivePositionCatalogRepository extends MongoRepository<ExecutivePositionCatalog, String> {
    Optional<ExecutivePositionCatalog> findByCode(String code);
    List<ExecutivePositionCatalog> findByOrgUnitCodeAndActiveTrue(String orgUnitCode);
}

