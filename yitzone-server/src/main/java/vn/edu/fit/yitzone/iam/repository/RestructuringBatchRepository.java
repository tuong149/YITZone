package vn.edu.fit.yitzone.iam.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.iam.domain.RestructuringBatch;

import java.time.Instant;
import java.util.List;

public interface RestructuringBatchRepository extends MongoRepository<RestructuringBatch, String> {
    List<RestructuringBatch> findByStatusAndEffectiveAtLessThanEqual(
            RestructuringBatch.BatchStatus status,
            Instant effectiveAt
    );
    List<RestructuringBatch> findAllByOrderByCreatedAtDesc();
}
