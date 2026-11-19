package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Hybrid tree model for the 4 Committees - 9 Teams structure (LLD 2.3.1).
 */
@Document(collection = "ORG_UNITS")
public class OrgUnit {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code; // e.g., EMFIT, SV5T, OFIT, ARTIT

    private String name;
    private UnitType unitType;
    private String parentId;

    @Indexed
    private List<String> ancestors = new ArrayList<>();

    private List<String> defaultDeptModules = new ArrayList<>();

    public enum UnitType {
        FACULTY_UNION, COMMITTEE, TEAM
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public UnitType getUnitType() { return unitType; }
    public void setUnitType(UnitType unitType) { this.unitType = unitType; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public List<String> getAncestors() { return ancestors; }
    public void setAncestors(List<String> ancestors) { this.ancestors = ancestors; }
    public List<String> getDefaultDeptModules() { return defaultDeptModules; }
    public void setDefaultDeptModules(List<String> defaultDeptModules) { this.defaultDeptModules = defaultDeptModules; }
}
