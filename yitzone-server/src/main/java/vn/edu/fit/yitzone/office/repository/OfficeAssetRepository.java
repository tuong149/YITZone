package vn.edu.fit.yitzone.office.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.office.domain.OfficeAsset;

import java.util.List;
import java.util.Optional;

public interface OfficeAssetRepository extends MongoRepository<OfficeAsset, String> {
    Optional<OfficeAsset> findByAssetCode(String assetCode);
    List<OfficeAsset> findByCategory(OfficeAsset.AssetCategory category);
    List<OfficeAsset> findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(
            String borrowerUserId,
            List<OfficeAsset.BorrowStatus> statuses
    );
}
