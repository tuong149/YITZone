package vn.edu.fit.yitzone.office.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Reusable office equipment (QR-tagged) and consumable supplies with borrow/return logs (UC-DUTY-06).
 */
@Document(collection = "OFFICE_ASSETS")
public class OfficeAsset {
    @Id
    private String id;

    @Indexed(unique = true)
    private String assetCode;

    private String name;
    private AssetCategory category = AssetCategory.REUSABLE_EQUIPMENT;
    private String unit;
    private int totalQuantity = 0;
    private int availableQuantity = 0;
    private int damagedQuantity = 0;
    private int lostQuantity = 0;
    private int surplusUnregisteredQty = 0;
    private int minThresholdQty = 0;
    private ConditionStatus conditionStatus = ConditionStatus.GOOD;
    private List<BorrowLog> borrowLogs = new ArrayList<>();

    public enum AssetCategory {
        REUSABLE_EQUIPMENT, CONSUMABLE_SUPPLY
    }

    public enum ConditionStatus {
        GOOD, DAMAGED, UNDER_REPAIR, LOST, SURPLUS_UNREGISTERED
    }

    public enum BorrowStatus {
        BORROWED, RETURNED, OVERDUE
    }

    public record BorrowLog(
            String borrowId,
            String borrowerUserId,
            String eventId,
            int qty,
            String conditionOnBorrow,
            Instant borrowedAt,
            Instant returnedAt,
            int damagedOnReturnQty,
            String returnConditionNote,
            BorrowStatus status
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAssetCode() { return assetCode; }
    public void setAssetCode(String assetCode) { this.assetCode = assetCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public AssetCategory getCategory() { return category; }
    public void setCategory(AssetCategory category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public int getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(int totalQuantity) { this.totalQuantity = totalQuantity; }
    public int getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(int availableQuantity) { this.availableQuantity = availableQuantity; }
    public int getDamagedQuantity() { return damagedQuantity; }
    public void setDamagedQuantity(int damagedQuantity) { this.damagedQuantity = damagedQuantity; }
    public int getLostQuantity() { return lostQuantity; }
    public void setLostQuantity(int lostQuantity) { this.lostQuantity = lostQuantity; }
    public int getSurplusUnregisteredQty() { return surplusUnregisteredQty; }
    public void setSurplusUnregisteredQty(int surplusUnregisteredQty) { this.surplusUnregisteredQty = surplusUnregisteredQty; }
    public int getMinThresholdQty() { return minThresholdQty; }
    public void setMinThresholdQty(int minThresholdQty) { this.minThresholdQty = minThresholdQty; }
    public ConditionStatus getConditionStatus() { return conditionStatus; }
    public void setConditionStatus(ConditionStatus conditionStatus) { this.conditionStatus = conditionStatus; }
    public List<BorrowLog> getBorrowLogs() { return borrowLogs; }
    public void setBorrowLogs(List<BorrowLog> borrowLogs) { this.borrowLogs = borrowLogs; }
}
