package vn.edu.fit.yitzone.event.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "EVENTS")
public class Event {
    @Id
    private String id;

    @Version
    private Long version;

    private String title;
    private String description;
    private EventVisibility visibility = EventVisibility.PUBLIC_FACULTY;
    private String organizerUnitId;
    private List<String> benefitTypes = new ArrayList<>();
    private Instant startTime;
    private Instant endTime;
    private boolean allowBarcodeWalkIn = false;
    private int riskReviewThreshold = 2;
    private String status = "DRAFT";

    public enum EventVisibility {
        PUBLIC_FACULTY,
        INTERNAL_CTV
    }

    public boolean isInternalCtvWithoutBenefits() {
        return visibility == EventVisibility.INTERNAL_CTV
                && (benefitTypes == null || benefitTypes.isEmpty());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public EventVisibility getVisibility() { return visibility; }
    public void setVisibility(EventVisibility visibility) { this.visibility = visibility; }
    public String getOrganizerUnitId() { return organizerUnitId; }
    public void setOrganizerUnitId(String organizerUnitId) { this.organizerUnitId = organizerUnitId; }
    public List<String> getBenefitTypes() { return benefitTypes; }
    public void setBenefitTypes(List<String> benefitTypes) { this.benefitTypes = benefitTypes; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public boolean isAllowBarcodeWalkIn() { return allowBarcodeWalkIn; }
    public void setAllowBarcodeWalkIn(boolean allowBarcodeWalkIn) { this.allowBarcodeWalkIn = allowBarcodeWalkIn; }
    public int getRiskReviewThreshold() { return riskReviewThreshold; }
    public void setRiskReviewThreshold(int riskReviewThreshold) { this.riskReviewThreshold = riskReviewThreshold; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
