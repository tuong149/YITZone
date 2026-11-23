package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Idempotent VietQR payment webhook reconciliation transaction (UC-STR-03).
 */
@Document(collection = "PAYMENT_TRANSACTIONS")
public class PaymentTransaction {
    @Id
    private String id;

    @Indexed(unique = true)
    private String bankTransactionId;

    private String orderId;
    private String orderCodeExtracted;
    private long transferAmountVnd;
    private String transferContent;
    private boolean signatureVerified = false;
    private ReconciliationStatus reconciliationStatus;
    private Instant receivedAt = Instant.now();

    public enum ReconciliationStatus {
        MATCHED_PAID,
        MISMATCH_AMOUNT,
        LATE_AFTER_CANCELLED,
        UNIDENTIFIED_ORDER
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBankTransactionId() { return bankTransactionId; }
    public void setBankTransactionId(String bankTransactionId) { this.bankTransactionId = bankTransactionId; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getOrderCodeExtracted() { return orderCodeExtracted; }
    public void setOrderCodeExtracted(String orderCodeExtracted) { this.orderCodeExtracted = orderCodeExtracted; }
    public long getTransferAmountVnd() { return transferAmountVnd; }
    public void setTransferAmountVnd(long transferAmountVnd) { this.transferAmountVnd = transferAmountVnd; }
    public String getTransferContent() { return transferContent; }
    public void setTransferContent(String transferContent) { this.transferContent = transferContent; }
    public boolean isSignatureVerified() { return signatureVerified; }
    public void setSignatureVerified(boolean signatureVerified) { this.signatureVerified = signatureVerified; }
    public ReconciliationStatus getReconciliationStatus() { return reconciliationStatus; }
    public void setReconciliationStatus(ReconciliationStatus reconciliationStatus) { this.reconciliationStatus = reconciliationStatus; }
    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }
}
