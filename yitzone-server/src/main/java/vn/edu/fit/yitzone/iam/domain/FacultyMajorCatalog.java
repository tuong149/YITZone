package vn.edu.fit.yitzone.iam.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Dynamic catalog of university faculties and majors (seeded from khoa_nganh.csv, FR-IAM-01).
 * Used to resolve facultyName, majorName, and FIT eligibility (CĐDN) from MSSV (AABBBCCC).
 */
@Document(collection = "FACULTY_MAJOR_CATALOG")
public class FacultyMajorCatalog {
    @Id
    private String id;

    @Indexed(unique = true)
    private String majorCode;

    private String majorName;
    private String facultyName;
    private boolean fitFaculty;
    private boolean active = true;
    private Instant updatedAt;
    private String updatedBy;

    public FacultyMajorCatalog() {
    }

    public FacultyMajorCatalog(
            String majorCode,
            String majorName,
            String facultyName,
            boolean fitFaculty,
            boolean active,
            Instant updatedAt,
            String updatedBy
    ) {
        this.majorCode = majorCode;
        this.majorName = majorName;
        this.facultyName = facultyName;
        this.fitFaculty = fitFaculty;
        this.active = active;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getMajorName() { return majorName; }
    public void setMajorName(String majorName) { this.majorName = majorName; }
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    public boolean isFitFaculty() { return fitFaculty; }
    public void setFitFaculty(boolean fitFaculty) { this.fitFaculty = fitFaculty; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
