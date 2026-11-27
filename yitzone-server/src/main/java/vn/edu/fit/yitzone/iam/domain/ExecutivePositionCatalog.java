package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Dynamic catalog of executive & unit leadership position titles (UC-IAM-09).
 * Seeded with the 7 standard dual-track titles from ExecutivePositionTitle and extensible by BTV.
 */
@Document(collection = "EXECUTIVE_POSITION_TITLES")
public class ExecutivePositionCatalog {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String displayName;
    private String orgUnitCode;
    private RoleCode mappedRoleCode;
    private int maxQuota = 1;
    private boolean systemDefault = false;
    private boolean active = true;
    private Instant updatedAt = Instant.now();
    private String updatedBy;

    public ExecutivePositionCatalog() {
    }

    public ExecutivePositionCatalog(
            String code,
            String displayName,
            String orgUnitCode,
            RoleCode mappedRoleCode,
            int maxQuota,
            boolean systemDefault,
            boolean active,
            Instant updatedAt,
            String updatedBy
    ) {
        this.code = code;
        this.displayName = displayName;
        this.orgUnitCode = orgUnitCode;
        this.mappedRoleCode = mappedRoleCode;
        this.maxQuota = maxQuota;
        this.systemDefault = systemDefault;
        this.active = active;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getOrgUnitCode() { return orgUnitCode; }
    public void setOrgUnitCode(String orgUnitCode) { this.orgUnitCode = orgUnitCode; }
    public RoleCode getMappedRoleCode() { return mappedRoleCode; }
    public void setMappedRoleCode(RoleCode mappedRoleCode) { this.mappedRoleCode = mappedRoleCode; }
    public int getMaxQuota() { return maxQuota; }
    public void setMaxQuota(int maxQuota) { this.maxQuota = maxQuota; }
    public boolean isSystemDefault() { return systemDefault; }
    public void setSystemDefault(boolean systemDefault) { this.systemDefault = systemDefault; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}

