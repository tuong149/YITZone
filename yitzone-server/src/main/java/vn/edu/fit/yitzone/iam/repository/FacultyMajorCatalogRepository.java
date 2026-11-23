package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.FacultyMajorCatalog;

import java.util.List;
import java.util.Optional;

public interface FacultyMajorCatalogRepository extends MongoRepository<FacultyMajorCatalog, String> {
    Optional<FacultyMajorCatalog> findByMajorCode(String majorCode);

    List<FacultyMajorCatalog> findByFitFacultyTrueAndActiveTrue();

    List<FacultyMajorCatalog> findByFacultyNameIgnoreCase(String facultyName);
}
