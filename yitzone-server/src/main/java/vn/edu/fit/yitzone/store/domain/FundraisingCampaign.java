package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Fundraising campaign tracking revenue, COGS (at fulfillment), refunds, and net profit separately (UC-STR-01, UC-STR-06).
 */
@Document(collection = "FUNDRAISING_CAMPAIGNS")
public class FundraisingCampaign {
    @Id
    private String id;

    private String title;
    private String description;
    private String bannerImageUrl;
    private Instant startDate;
    private Instant endDate;
    private String organizerUnitId;

    private long targetAmountVnd = 0L;
    private long totalRevenueVnd = 0L;
    private long totalCostOfGoodsVnd = 0L;
    private long totalRefundedVnd = 0L;
    private long netProfitFundVnd = 0L;
    private long totalClassroomDeliveryFeeVnd = 0L;

    private BankAccountConfig bankAccountConfig;
    private CampaignStatus status = CampaignStatus.DRAFT;

    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }

    public enum CampaignStatus {
        DRAFT, OPEN, CLOSED
    }

    public record BankAccountConfig(
            String bankBin,
            String accountNo,
            String accountName,
            boolean orgAccount,
            ApprovalStatus approvalStatus,
            String approvedByBtvId,
            Instant approvedAt
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getBannerImageUrl() { return bannerImageUrl; }
    public void setBannerImageUrl(String bannerImageUrl) { this.bannerImageUrl = bannerImageUrl; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public String getOrganizerUnitId() { return organizerUnitId; }
    public void setOrganizerUnitId(String organizerUnitId) { this.organizerUnitId = organizerUnitId; }
    public long getTargetAmountVnd() { return targetAmountVnd; }
    public void setTargetAmountVnd(long targetAmountVnd) { this.targetAmountVnd = targetAmountVnd; }
    public long getTotalRevenueVnd() { return totalRevenueVnd; }
    public void setTotalRevenueVnd(long totalRevenueVnd) { this.totalRevenueVnd = totalRevenueVnd; }
    public long getTotalCostOfGoodsVnd() { return totalCostOfGoodsVnd; }
    public void setTotalCostOfGoodsVnd(long totalCostOfGoodsVnd) { this.totalCostOfGoodsVnd = totalCostOfGoodsVnd; }
    public long getTotalRefundedVnd() { return totalRefundedVnd; }
    public void setTotalRefundedVnd(long totalRefundedVnd) { this.totalRefundedVnd = totalRefundedVnd; }
    public long getNetProfitFundVnd() { return netProfitFundVnd; }
    public void setNetProfitFundVnd(long netProfitFundVnd) { this.netProfitFundVnd = netProfitFundVnd; }
    public long getTotalClassroomDeliveryFeeVnd() { return totalClassroomDeliveryFeeVnd; }
    public void setTotalClassroomDeliveryFeeVnd(long totalClassroomDeliveryFeeVnd) { this.totalClassroomDeliveryFeeVnd = totalClassroomDeliveryFeeVnd; }
    public BankAccountConfig getBankAccountConfig() { return bankAccountConfig; }
    public void setBankAccountConfig(BankAccountConfig bankAccountConfig) { this.bankAccountConfig = bankAccountConfig; }
    public CampaignStatus getStatus() { return status; }
    public void setStatus(CampaignStatus status) { this.status = status; }
}
