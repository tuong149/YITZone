package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Store product category with inherited delivery methods and classroom delivery fee config (UC-STR-01, UC-STR-02).
 */
@Document(collection = "STORE_CATEGORIES")
public class StoreCategory {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String name;
    private List<DeliveryMethod> allowedDeliveryMethods = new ArrayList<>(
            List.of(DeliveryMethod.OFFICE_PICKUP, DeliveryMethod.CLASSROOM_DELIVERY)
    );
    private DeliveryFeeConfig deliveryFeeConfig = new DeliveryFeeConfig(0L, 5000);
    private boolean active = true;

    public enum DeliveryMethod {
        OFFICE_PICKUP, CLASSROOM_DELIVERY
    }

    public record DeliveryFeeConfig(
            long classroomDeliveryFeeVnd,
            int maxClassroomWeightGrams
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<DeliveryMethod> getAllowedDeliveryMethods() { return allowedDeliveryMethods; }
    public void setAllowedDeliveryMethods(List<DeliveryMethod> allowedDeliveryMethods) { this.allowedDeliveryMethods = allowedDeliveryMethods; }
    public DeliveryFeeConfig getDeliveryFeeConfig() { return deliveryFeeConfig; }
    public void setDeliveryFeeConfig(DeliveryFeeConfig deliveryFeeConfig) { this.deliveryFeeConfig = deliveryFeeConfig; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
