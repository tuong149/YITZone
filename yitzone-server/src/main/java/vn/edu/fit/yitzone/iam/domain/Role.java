package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Role definition with recursive inheritance and Grant Ceiling hierarchy level (UC-IAM-09, UC-IAM-10).
 */
@Document(collection = "ROLES")
public class Role {
    @Id
    private String id;

    @Indexed(unique = true)
    private RoleCode code;

    private String name;
    private RoleCode parentRoleCode;
    private int hierarchyLevel;
    private List<String> moduleCodes = new ArrayList<>();
    private List<String> permissions = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public RoleCode getCode() { return code; }
    public void setCode(RoleCode code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RoleCode getParentRoleCode() { return parentRoleCode; }
    public void setParentRoleCode(RoleCode parentRoleCode) { this.parentRoleCode = parentRoleCode; }
    public int getHierarchyLevel() { return hierarchyLevel; }
    public void setHierarchyLevel(int hierarchyLevel) { this.hierarchyLevel = hierarchyLevel; }
    public List<String> getModuleCodes() { return moduleCodes; }
    public void setModuleCodes(List<String> moduleCodes) { this.moduleCodes = moduleCodes; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
