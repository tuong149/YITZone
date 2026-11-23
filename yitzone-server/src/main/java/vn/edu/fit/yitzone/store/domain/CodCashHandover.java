package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * End-of-shift COD cash handover slip from booth CTV to Treasurer with 24h alert SLA (UC-STR-04).
 */
@Document(collection = "COD_CASH_HANDOVERS")
@CompoundIndex(name = "idx_cod_handover_collector_status", def = "{'collectorUserId': 1, 'status': 1, 'createdAt': 1}")
public class CodCashHandover {
    @Id
    private String id;

    @Indexed(unique = true)
    private String handoverCode;

    private String shiftId;
    private String collectorUserId;
    private String treasurerUserId;
    private List<String> orderIds = new ArrayList<>();
    private long expectedTotalCashVnd = 0L;
    private Long actualHandedOverCashVnd;
    private Long discrepancyVnd;
    private HandoverStatus status = HandoverStatus.PENDING_HANDOVER;
    private Instant createdAt = Instant.now();
    private Instant confirmedAt;
    private String note;

    public enum HandoverStatus {
        PENDING_HANDOVER, CONFIRMED, DISCREPANCY_FLAGGED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getHandoverCode() { return handoverCode; }
    public void setHandoverCode(String handoverCode) { this.handoverCode = handoverCode; }
    public String getShiftId() { return shiftId; }
    public void setShiftId(String shiftId) { this.shiftId = shiftId; }
    public String getCollectorUserId() { return collectorUserId; }
    public void setCollectorUserId(String collectorUserId) { this.collectorUserId = collectorUserId; }
    public String getTreasurerUserId() { return treasurerUserId; }
    public void setTreasurerUserId(String treasurerUserId) { this.treasurerUserId = treasurerUserId; }
    public List<String> getOrderIds() { return orderIds; }
    public void setOrderIds(List<String> orderIds) { this.orderIds = orderIds; }
    public long getExpectedTotalCashVnd() { return expectedTotalCashVnd; }
    public void setExpectedTotalCashVnd(long expectedTotalCashVnd) { this.expectedTotalCashVnd = expectedTotalCashVnd; }
    public Long getActualHandedOverCashVnd() { return actualHandedOverCashVnd; }
    public void setActualHandedOverCashVnd(Long actualHandedOverCashVnd) { this.actualHandedOverCashVnd = actualHandedOverCashVnd; }
    public Long getDiscrepancyVnd() { return discrepancyVnd; }
    public void setDiscrepancyVnd(Long discrepancyVnd) { this.discrepancyVnd = discrepancyVnd; }
    public HandoverStatus getStatus() { return status; }
    public void setStatus(HandoverStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
