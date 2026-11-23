package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "USERS")
@CompoundIndex(name = "idx_users_role_scope", def = "{'roleScopes.scopeId': 1, 'roleScopes.roleCode': 1}")
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

    @Indexed(unique = true, sparse = true)
    private String personalEmail;
    private boolean personalEmailVerified = false;
    private Instant personalEmailVerifiedAt;

    private String fullName;
    private String className;
    private Integer cohort;
    private String majorCode;
    private UnionMemberProfile unionMemberProfile;
    private FacultyOverride facultyOverride;
    private String portraitPhotoUrl;
    private LifecycleStatus lifecycleStatus = LifecycleStatus.ACTIVE_STUDY;
    private MemberStatus memberStatus;
    private long permissionVersion = 1L;
    private List<RoleScope> roleScopes = new ArrayList<>();
    private List<AssignedModule> assignedModules = new ArrayList<>();
    private List<TermHistory> termHistory = new ArrayList<>();
    private Instant tempGuestExpiresAt;
    private Instant lastLoginAt;

    public enum UserType {
        STUDENT, STAFF_LECTURER, GRAD_SECOND_DEGREE, TEMP_GUEST
    }

    public enum LifecycleStatus {
        ACTIVE_STUDY, GRADUATED, ARCHIVED
    }

    public enum MemberStatus {
        ACTIVE, ON_LEAVE, LEFT
    }

    public record UnionMemberProfile(
            String youthUnionBranch,
            String studentAssociationBranch,
            LocalDate youthUnionJoinDate,
            LocalDate studentAssociationJoinDate
    ) {
    }

    public record FacultyOverride(
            boolean enabled,
            LocalDate effectiveDate,
            String reason,
            String approvedBy,
            Instant approvedAt
    ) {
    }

    public record RoleScope(
            RoleCode roleCode,
            ExecutivePositionTitle positionTitle,
            String unitId,
            String scopeType,
            String scopeId,
            String termYear,
            Instant startAt,
            Instant endAt,
            Instant expiresAt
    ) {
        public boolean isActiveAt(Instant now) {
            return (startAt == null || !now.isBefore(startAt))
                    && (endAt == null || now.isBefore(endAt))
                    && (expiresAt == null || now.isBefore(expiresAt));
        }
    }

    public record AssignedModule(
            String moduleCode,
            String scopeType,
            String scopeId,
            Instant expiresAt
    ) {
    }

    public record TermHistory(
            String termYear,
            String unitName,
            String positionTitle,
            Instant startAt,
            Instant endAt
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
    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }
    public boolean isPersonalEmailVerified() { return personalEmailVerified; }
    public void setPersonalEmailVerified(boolean personalEmailVerified) { this.personalEmailVerified = personalEmailVerified; }
    public Instant getPersonalEmailVerifiedAt() { return personalEmailVerifiedAt; }
    public void setPersonalEmailVerifiedAt(Instant personalEmailVerifiedAt) { this.personalEmailVerifiedAt = personalEmailVerifiedAt; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public Integer getCohort() { return cohort; }
    public void setCohort(Integer cohort) { this.cohort = cohort; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public UnionMemberProfile getUnionMemberProfile() { return unionMemberProfile; }
    public void setUnionMemberProfile(UnionMemberProfile unionMemberProfile) { this.unionMemberProfile = unionMemberProfile; }
    public FacultyOverride getFacultyOverride() { return facultyOverride; }
    public void setFacultyOverride(FacultyOverride facultyOverride) { this.facultyOverride = facultyOverride; }
    public String getPortraitPhotoUrl() { return portraitPhotoUrl; }
    public void setPortraitPhotoUrl(String portraitPhotoUrl) { this.portraitPhotoUrl = portraitPhotoUrl; }
    public LifecycleStatus getLifecycleStatus() { return lifecycleStatus; }
    public void setLifecycleStatus(LifecycleStatus lifecycleStatus) { this.lifecycleStatus = lifecycleStatus; }
    public MemberStatus getMemberStatus() { return memberStatus; }
    public void setMemberStatus(MemberStatus memberStatus) { this.memberStatus = memberStatus; }
    public long getPermissionVersion() { return permissionVersion; }
    public void setPermissionVersion(long permissionVersion) { this.permissionVersion = permissionVersion; }
    public List<RoleScope> getRoleScopes() { return roleScopes; }
    public void setRoleScopes(List<RoleScope> roleScopes) { this.roleScopes = roleScopes; }
    public List<AssignedModule> getAssignedModules() { return assignedModules; }
    public void setAssignedModules(List<AssignedModule> assignedModules) { this.assignedModules = assignedModules; }
    public List<TermHistory> getTermHistory() { return termHistory; }
    public void setTermHistory(List<TermHistory> termHistory) { this.termHistory = termHistory; }
    public Instant getTempGuestExpiresAt() { return tempGuestExpiresAt; }
    public void setTempGuestExpiresAt(Instant tempGuestExpiresAt) { this.tempGuestExpiresAt = tempGuestExpiresAt; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
