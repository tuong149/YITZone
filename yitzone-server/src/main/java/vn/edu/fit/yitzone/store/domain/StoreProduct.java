package vn.edu.fit.yitzone.store.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Faculty merchandise or fundraising item with SKU variants, cost price, sale price, and stock (UC-STR-01).
 */
@Document(collection = "STORE_PRODUCTS")
@CompoundIndexes({
        @CompoundIndex(name = "uq_store_product_sku", def = "{'variants.sku': 1}", unique = true, sparse = true),
        @CompoundIndex(name = "idx_store_product_category_status", def = "{'categoryId': 1, 'status': 1}")
})
public class StoreProduct {
    @Id
    private String id;

    private String name;
    private String categoryId;
    private ProductType productType = ProductType.FACULTY_MERCH;
    private String campaignId;
    private boolean preOrder = false;
    private boolean codAllowed = false;
    private List<StoreCategory.DeliveryMethod> allowedDeliveryMethods = new ArrayList<>();
    private String promotionalBadge;
    private Instant saleStartAt;
    private Instant saleEndAt;
    private List<ProductVariant> variants = new ArrayList<>();
    private ProductStatus status = ProductStatus.ACTIVE;

    public enum ProductType {
        FACULTY_MERCH, FUNDRAISING_ITEM
    }

    public enum ProductStatus {
        ACTIVE, OUT_OF_STOCK, ARCHIVED
    }

    public record ProductVariant(
            String sku,
            String sizeName,
            String color,
            int weightGrams,
            long costPriceVnd,
            long originalPriceVnd,
            Long salePriceVnd,
            boolean onSale,
            int stockQuantity
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public ProductType getProductType() { return productType; }
    public void setProductType(ProductType productType) { this.productType = productType; }
    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public boolean isPreOrder() { return preOrder; }
    public void setPreOrder(boolean preOrder) { this.preOrder = preOrder; }
    public boolean isCodAllowed() { return codAllowed; }
    public void setCodAllowed(boolean codAllowed) { this.codAllowed = codAllowed; }
    public List<StoreCategory.DeliveryMethod> getAllowedDeliveryMethods() { return allowedDeliveryMethods; }
    public void setAllowedDeliveryMethods(List<StoreCategory.DeliveryMethod> allowedDeliveryMethods) { this.allowedDeliveryMethods = allowedDeliveryMethods; }
    public String getPromotionalBadge() { return promotionalBadge; }
    public void setPromotionalBadge(String promotionalBadge) { this.promotionalBadge = promotionalBadge; }
    public Instant getSaleStartAt() { return saleStartAt; }
    public void setSaleStartAt(Instant saleStartAt) { this.saleStartAt = saleStartAt; }
    public Instant getSaleEndAt() { return saleEndAt; }
    public void setSaleEndAt(Instant saleEndAt) { this.saleEndAt = saleEndAt; }
    public List<ProductVariant> getVariants() { return variants; }
    public void setVariants(List<ProductVariant> variants) { this.variants = variants; }
    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }
}
