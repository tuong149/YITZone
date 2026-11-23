package vn.edu.fit.yitzone.oj.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Online Judge algorithm problem definition and testcase bundle reference (UC-OJ-01).
 */
@Document(collection = "OJ_PROBLEMS")
public class OjProblem {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String title;
    private String description;
    private int timeLimitMs = 1000;
    private int memoryLimitKb = 262144;
    private List<ProgrammingLanguage> allowedLanguages = new ArrayList<>(
            List.of(ProgrammingLanguage.CPP, ProgrammingLanguage.PYTHON, ProgrammingLanguage.JAVA, ProgrammingLanguage.C)
    );
    private String testcasesZipUrl;
    private Difficulty difficulty = Difficulty.EASY;
    private List<String> tags = new ArrayList<>();
    private String createdBy;
    private ProblemStatus status = ProblemStatus.DRAFT;

    public enum ProgrammingLanguage {
        C, CPP, PYTHON, JAVA
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    public enum ProblemStatus {
        DRAFT, PUBLISHED, ARCHIVED
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(int timeLimitMs) { this.timeLimitMs = timeLimitMs; }
    public int getMemoryLimitKb() { return memoryLimitKb; }
    public void setMemoryLimitKb(int memoryLimitKb) { this.memoryLimitKb = memoryLimitKb; }
    public List<ProgrammingLanguage> getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(List<ProgrammingLanguage> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
    public String getTestcasesZipUrl() { return testcasesZipUrl; }
    public void setTestcasesZipUrl(String testcasesZipUrl) { this.testcasesZipUrl = testcasesZipUrl; }
    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public ProblemStatus getStatus() { return status; }
    public void setStatus(ProblemStatus status) { this.status = status; }
}
