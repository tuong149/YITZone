package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Layer-2 Trusted Identity Fallback Roster imported from CTSV/Academic Affairs CSV (HLD 3.1, B2).
 */
@Document(collection = "OFFICIAL_DIRECTORY_ROSTER")
public class OfficialDirectoryRoster {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private User.UserType userType;

    @Indexed(unique = true, sparse = true)
    private String studentCode;

    @Indexed(unique = true, sparse = true)
    private String staffId;

    private String fullName;
    private String className;
    private String majorCode;
    private String importedTerm;
    private String importedBy;
    private Instant importedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public User.UserType getUserType() { return userType; }
    public void setUserType(User.UserType userType) { this.userType = userType; }
    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getImportedTerm() { return importedTerm; }
    public void setImportedTerm(String importedTerm) { this.importedTerm = importedTerm; }
    public String getImportedBy() { return importedBy; }
    public void setImportedBy(String importedBy) { this.importedBy = importedBy; }
    public Instant getImportedAt() { return importedAt; }
    public void setImportedAt(Instant importedAt) { this.importedAt = importedAt; }
}
