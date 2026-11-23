package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * 20 Business Permission Module packages (UC-IAM-09, UC-IAM-10, LLD 2.2).
 */
@Document(collection = "PERMISSION_MODULES")
public class PermissionModule {
    @Id
    private String id;

    @Indexed(unique = true)
    private String moduleCode;

    private String name;
    private String description;
    private List<String> includedPermissions = new ArrayList<>();
    private boolean nonDelegable = false;
    private boolean systemDefault = true;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getModuleCode() { return moduleCode; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getIncludedPermissions() { return includedPermissions; }
    public void setIncludedPermissions(List<String> includedPermissions) { this.includedPermissions = includedPermissions; }
    public boolean isNonDelegable() { return nonDelegable; }
    public void setNonDelegable(boolean nonDelegable) { this.nonDelegable = nonDelegable; }
    public boolean isSystemDefault() { return systemDefault; }
    public void setSystemDefault(boolean systemDefault) { this.systemDefault = systemDefault; }
}
