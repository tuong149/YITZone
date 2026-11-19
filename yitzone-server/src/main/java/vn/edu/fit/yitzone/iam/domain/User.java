package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "USERS")
public class User {
    @Id
    private String id;

    private UserType userType = UserType.STUDENT;

    @Indexed(unique = true, sparse = true)
    private String studentCode;

    @Indexed(unique = true, sparse = true)
    private String staffId;

    @Indexed(unique = true)
    private String email;

    private String fullName;
    private String className;
    private Integer cohort;
    private String majorCode;
    private String portraitPhotoUrl;
    private LifecycleStatus lifecycleStatus = LifecycleStatus.ACTIVE_STUDY;
    private long permissionVersion = 1L;
    private List<RoleScope> roleScopes = new ArrayList<>();
    private List<AssignedModule> assignedModules = new ArrayList<>();
    private Instant lastLoginAt;

    public enum UserType {
        STUDENT, STAFF_LECTURER, GRAD_SECOND_DEGREE, TEMP_GUEST
    }

    public enum LifecycleStatus {
        ACTIVE_STUDY, GRADUATED, ARCHIVED
    }

    public record RoleScope(
            RoleCode roleCode,
            String unitId,
            String scopeType,
            String scopeId,
            String termYear,
            Instant startAt,
            Instant endAt,
            Instant expiresAt
    ) {
    }

    public record AssignedModule(
            String moduleCode,
            String scopeType,
            String scopeId,
            Instant expiresAt
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public UserType getUserType() { return userType; }
    public void setUserType(UserType userType) { this.userType = userType; }
    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public Integer getCohort() { return cohort; }
    public void setCohort(Integer cohort) { this.cohort = cohort; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getPortraitPhotoUrl() { return portraitPhotoUrl; }
    public void setPortraitPhotoUrl(String portraitPhotoUrl) { this.portraitPhotoUrl = portraitPhotoUrl; }
    public LifecycleStatus getLifecycleStatus() { return lifecycleStatus; }
    public void setLifecycleStatus(LifecycleStatus lifecycleStatus) { this.lifecycleStatus = lifecycleStatus; }
    public long getPermissionVersion() { return permissionVersion; }
    public void setPermissionVersion(long permissionVersion) { this.permissionVersion = permissionVersion; }
    public List<RoleScope> getRoleScopes() { return roleScopes; }
    public void setRoleScopes(List<RoleScope> roleScopes) { this.roleScopes = roleScopes; }
    public List<AssignedModule> getAssignedModules() { return assignedModules; }
    public void setAssignedModules(List<AssignedModule> assignedModules) { this.assignedModules = assignedModules; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
