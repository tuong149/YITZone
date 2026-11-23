package vn.edu.fit.yitzone.audit.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.audit.domain.AuditLog;

import java.util.Optional;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    Optional<AuditLog> findBySeq(long seq);
    Page<AuditLog> findAllByOrderBySeqDesc(Pageable pageable);
}
