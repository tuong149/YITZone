package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PermissionModuleRepository extends MongoRepository<PermissionModule, String> {
    Optional<PermissionModule> findByModuleCode(String moduleCode);
    List<PermissionModule> findByModuleCodeIn(Collection<String> moduleCodes);
}
