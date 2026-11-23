package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Store discount voucher for item amount or classroom delivery fee (UC-STR-01, UC-STR-02).
 */
@Document(collection = "STORE_VOUCHERS")
public class StoreVoucher {
    @Id
    private String id;

    @Indexed(unique = true)
    private String voucherCode;

    private String title;
    private DiscountType discountType;
    private long discountValue;
    private Long maxDiscountVnd;
    private long minOrderAmountVnd = 0L;
    private ApplicableScope applicableScope = ApplicableScope.ALL_STORE;
    private List<String> targetIds = new ArrayList<>();
    private boolean stackableWithSalePrice = false;
    private int usageLimit;
    private int usedCount = 0;
    private int perUserLimit = 1;
    private Instant startDate;
    private Instant endDate;
    private VoucherStatus status = VoucherStatus.ACTIVE;

    public enum DiscountType {
        FIXED_AMOUNT, PERCENTAGE, CLASSROOM_DELIVERY_DISCOUNT
    }

    public enum ApplicableScope {
        ALL_STORE, CAMPAIGN_SPECIFIC, CATEGORY_SPECIFIC, PRODUCT_SPECIFIC
    }

    public enum VoucherStatus {
        ACTIVE, EXPIRED, DEPLETED, DISABLED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }
    public long getDiscountValue() { return discountValue; }
    public void setDiscountValue(long discountValue) { this.discountValue = discountValue; }
    public Long getMaxDiscountVnd() { return maxDiscountVnd; }
    public void setMaxDiscountVnd(Long maxDiscountVnd) { this.maxDiscountVnd = maxDiscountVnd; }
    public long getMinOrderAmountVnd() { return minOrderAmountVnd; }
    public void setMinOrderAmountVnd(long minOrderAmountVnd) { this.minOrderAmountVnd = minOrderAmountVnd; }
    public ApplicableScope getApplicableScope() { return applicableScope; }
    public void setApplicableScope(ApplicableScope applicableScope) { this.applicableScope = applicableScope; }
    public List<String> getTargetIds() { return targetIds; }
    public void setTargetIds(List<String> targetIds) { this.targetIds = targetIds; }
    public boolean isStackableWithSalePrice() { return stackableWithSalePrice; }
    public void setStackableWithSalePrice(boolean stackableWithSalePrice) { this.stackableWithSalePrice = stackableWithSalePrice; }
    public int getUsageLimit() { return usageLimit; }
    public void setUsageLimit(int usageLimit) { this.usageLimit = usageLimit; }
    public int getUsedCount() { return usedCount; }
    public void setUsedCount(int usedCount) { this.usedCount = usedCount; }
    public int getPerUserLimit() { return perUserLimit; }
    public void setPerUserLimit(int perUserLimit) { this.perUserLimit = perUserLimit; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public VoucherStatus getStatus() { return status; }
    public void setStatus(VoucherStatus status) { this.status = status; }
}
