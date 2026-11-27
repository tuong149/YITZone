package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.OfficialDirectoryRoster;

import java.util.Optional;

public interface OfficialDirectoryRosterRepository extends MongoRepository<OfficialDirectoryRoster, String> {
    Optional<OfficialDirectoryRoster> findByEmail(String email);
    Optional<OfficialDirectoryRoster> findByStudentCode(String studentCode);
    Page<OfficialDirectoryRoster> findByEmailContainingIgnoreCaseOrStudentCodeContainingIgnoreCaseOrFullNameContainingIgnoreCase(
            String email,
            String studentCode,
            String fullName,
            Pageable pageable
    );
}
