package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Store order supporting VietQR transfer and COD with reservation TTL managed via scheduler (UC-STR-02..04).
 */
@Document(collection = "STORE_ORDERS")
@CompoundIndexes({
        @CompoundIndex(name = "idx_store_order_buyer_status_created", def = "{'buyerId': 1, 'status': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_store_order_status_cod_due", def = "{'status': 1, 'codDueAt': 1}")
})
public class StoreOrder {
    @Id
    private String id;

    @Indexed(unique = true)
    private String orderCode;

    private String buyerId;
    private String campaignId;
    private List<OrderItem> items = new ArrayList<>();
    private int totalWeightGrams = 0;

    private long subtotalAmountVnd = 0L;
    private long totalCostOfGoodsVnd = 0L;
    private String voucherId;
    private String voucherCodeSnapshot;
    private long voucherDiscountVnd = 0L;
    private long baseDeliveryFeeVnd = 0L;
    private long deliveryDiscountVnd = 0L;
    private long deliveryFeeVnd = 0L;
    private long totalAmountVnd = 0L;

    private PaymentMethod paymentMethod = PaymentMethod.VIETQR_TRANSFER;
    private String paymentProofUrl;
    private Instant paymentExpiresAt;
    private Instant codDueAt;
    private String codConfirmedBy;
    private Instant codConfirmedAt;
    private Long codAmountCollectedVnd;
    private String codHandoverId;

    private StoreCategory.DeliveryMethod deliveryMethod = StoreCategory.DeliveryMethod.OFFICE_PICKUP;
    private DeliveryDetails deliveryDetails;
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Indexed(unique = true, sparse = true)
    private String pickupQrToken;

    private String verifiedBy;
    private String fulfilledBy;
    private Instant fulfilledAt;
    private Instant createdAt = Instant.now();

    public enum PaymentMethod {
        VIETQR_TRANSFER, COD
    }

    public enum OrderStatus {
        PENDING_PAYMENT,
        PENDING_COD,
        PAID,
        COD_CONFIRMED,
        PAID_REFUND_PENDING,
        REFUNDED,
        COMPLETED,
        CANCELLED
    }

    public record OrderItem(
            String productId,
            String productName,
            String sku,
            String sizeName,
            int quantity,
            int weightGrams,
            long costPriceVnd,
            long originalPriceVnd,
            long appliedUnitPriceVnd,
            boolean salePriceApplied
    ) {
    }

    public record DeliveryDetails(
            String recipientName,
            String recipientPhone,
            String campusCode,
            String buildingCode,
            String classroomCode,
            String studyShiftNote
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
    public String getBuyerId() { return buyerId; }
    public void setBuyerId(String buyerId) { this.buyerId = buyerId; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public int getTotalWeightGrams() { return totalWeightGrams; }
    public void setTotalWeightGrams(int totalWeightGrams) { this.totalWeightGrams = totalWeightGrams; }
    public long getSubtotalAmountVnd() { return subtotalAmountVnd; }
    public void setSubtotalAmountVnd(long subtotalAmountVnd) { this.subtotalAmountVnd = subtotalAmountVnd; }
    public long getTotalCostOfGoodsVnd() { return totalCostOfGoodsVnd; }
    public void setTotalCostOfGoodsVnd(long totalCostOfGoodsVnd) { this.totalCostOfGoodsVnd = totalCostOfGoodsVnd; }
    public String getVoucherId() { return voucherId; }
    public void setVoucherId(String voucherId) { this.voucherId = voucherId; }
    public String getVoucherCodeSnapshot() { return voucherCodeSnapshot; }
    public void setVoucherCodeSnapshot(String voucherCodeSnapshot) { this.voucherCodeSnapshot = voucherCodeSnapshot; }
    public long getVoucherDiscountVnd() { return voucherDiscountVnd; }
    public void setVoucherDiscountVnd(long voucherDiscountVnd) { this.voucherDiscountVnd = voucherDiscountVnd; }
    public long getBaseDeliveryFeeVnd() { return baseDeliveryFeeVnd; }
    public void setBaseDeliveryFeeVnd(long baseDeliveryFeeVnd) { this.baseDeliveryFeeVnd = baseDeliveryFeeVnd; }
    public long getDeliveryDiscountVnd() { return deliveryDiscountVnd; }
    public void setDeliveryDiscountVnd(long deliveryDiscountVnd) { this.deliveryDiscountVnd = deliveryDiscountVnd; }
    public long getDeliveryFeeVnd() { return deliveryFeeVnd; }
    public void setDeliveryFeeVnd(long deliveryFeeVnd) { this.deliveryFeeVnd = deliveryFeeVnd; }
    public long getTotalAmountVnd() { return totalAmountVnd; }
    public void setTotalAmountVnd(long totalAmountVnd) { this.totalAmountVnd = totalAmountVnd; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentProofUrl() { return paymentProofUrl; }
    public void setPaymentProofUrl(String paymentProofUrl) { this.paymentProofUrl = paymentProofUrl; }
    public Instant getPaymentExpiresAt() { return paymentExpiresAt; }
    public void setPaymentExpiresAt(Instant paymentExpiresAt) { this.paymentExpiresAt = paymentExpiresAt; }
    public Instant getCodDueAt() { return codDueAt; }
    public void setCodDueAt(Instant codDueAt) { this.codDueAt = codDueAt; }
    public String getCodConfirmedBy() { return codConfirmedBy; }
    public void setCodConfirmedBy(String codConfirmedBy) { this.codConfirmedBy = codConfirmedBy; }
    public Instant getCodConfirmedAt() { return codConfirmedAt; }
    public void setCodConfirmedAt(Instant codConfirmedAt) { this.codConfirmedAt = codConfirmedAt; }
    public Long getCodAmountCollectedVnd() { return codAmountCollectedVnd; }
    public void setCodAmountCollectedVnd(Long codAmountCollectedVnd) { this.codAmountCollectedVnd = codAmountCollectedVnd; }
    public String getCodHandoverId() { return codHandoverId; }
    public void setCodHandoverId(String codHandoverId) { this.codHandoverId = codHandoverId; }
    public StoreCategory.DeliveryMethod getDeliveryMethod() { return deliveryMethod; }
    public void setDeliveryMethod(StoreCategory.DeliveryMethod deliveryMethod) { this.deliveryMethod = deliveryMethod; }
    public DeliveryDetails getDeliveryDetails() { return deliveryDetails; }
    public void setDeliveryDetails(DeliveryDetails deliveryDetails) { this.deliveryDetails = deliveryDetails; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public String getPickupQrToken() { return pickupQrToken; }
    public void setPickupQrToken(String pickupQrToken) { this.pickupQrToken = pickupQrToken; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public String getFulfilledBy() { return fulfilledBy; }
    public void setFulfilledBy(String fulfilledBy) { this.fulfilledBy = fulfilledBy; }
    public Instant getFulfilledAt() { return fulfilledAt; }
    public void setFulfilledAt(Instant fulfilledAt) { this.fulfilledAt = fulfilledAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
