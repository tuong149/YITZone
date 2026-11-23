package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Post-payment order support request for size/model exchange or return & refund (UC-STR-05).
 */
@Document(collection = "ORDER_SUPPORT_REQUESTS")
@CompoundIndex(name = "idx_order_support_order_status", def = "{'orderId': 1, 'status': 1}")
public class OrderSupportRequest {
    @Id
    private String id;

    @Indexed(unique = true)
    private String requestCode;

    private String orderId;
    private String buyerId;
    private SupportRequestType requestType;
    private List<RequestedExchangeItem> requestedItems = new ArrayList<>();
    private String reason;
    private List<String> proofImageUrls = new ArrayList<>();
    private SupportStatus status = SupportStatus.PENDING;
    private String handledBy;
    private Instant handledAt;
    private String refundTransactionRef;
    private Long refundAmountVnd;
    private boolean restockReturnedItems = false;
    private String handlingNote;
    private Instant createdAt = Instant.now();

    public enum SupportRequestType {
        SIZE_EXCHANGE, MODEL_EXCHANGE, RETURN_REFUND
    }

    public enum SupportStatus {
        PENDING, APPROVED, REJECTED, COMPLETED
    }

    public record RequestedExchangeItem(
            String oldSku,
            String newSku,
            int quantity
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRequestCode() { return requestCode; }
    public void setRequestCode(String requestCode) { this.requestCode = requestCode; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getBuyerId() { return buyerId; }
    public void setBuyerId(String buyerId) { this.buyerId = buyerId; }
    public SupportRequestType getRequestType() { return requestType; }
    public void setRequestType(SupportRequestType requestType) { this.requestType = requestType; }
    public List<RequestedExchangeItem> getRequestedItems() { return requestedItems; }
    public void setRequestedItems(List<RequestedExchangeItem> requestedItems) { this.requestedItems = requestedItems; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public List<String> getProofImageUrls() { return proofImageUrls; }
    public void setProofImageUrls(List<String> proofImageUrls) { this.proofImageUrls = proofImageUrls; }
    public SupportStatus getStatus() { return status; }
    public void setStatus(SupportStatus status) { this.status = status; }
    public String getHandledBy() { return handledBy; }
    public void setHandledBy(String handledBy) { this.handledBy = handledBy; }
    public Instant getHandledAt() { return handledAt; }
    public void setHandledAt(Instant handledAt) { this.handledAt = handledAt; }
    public String getRefundTransactionRef() { return refundTransactionRef; }
    public void setRefundTransactionRef(String refundTransactionRef) { this.refundTransactionRef = refundTransactionRef; }
    public Long getRefundAmountVnd() { return refundAmountVnd; }
    public void setRefundAmountVnd(Long refundAmountVnd) { this.refundAmountVnd = refundAmountVnd; }
    public boolean isRestockReturnedItems() { return restockReturnedItems; }
    public void setRestockReturnedItems(boolean restockReturnedItems) { this.restockReturnedItems = restockReturnedItems; }
    public String getHandlingNote() { return handlingNote; }
    public void setHandlingNote(String handlingNote) { this.handlingNote = handlingNote; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
