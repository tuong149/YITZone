package vn.edu.fit.yitzone.oj.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Isolated sandbox source code submission and verdict record (UC-OJ-02, UC-OJ-03).
 */
@Document(collection = "OJ_SUBMISSIONS")
@CompoundIndex(name = "idx_oj_sub_contest_user_problem", def = "{'contestId': 1, 'userId': 1, 'problemId': 1}")
public class OjSubmission {
    @Id
    private String id;

    private String problemId;
    private String userId;
    private String contestId;
    private OjProblem.ProgrammingLanguage language;
    private String sourceCode;
    private Verdict verdict = Verdict.PENDING;
    private Double score;
    private Integer executionTimeMs;
    private Integer memoryUsedKb;
    private String compileOutput;
    private List<TestcaseResult> testcaseResults = new ArrayList<>();
    private Instant submittedAt = Instant.now();

    public enum Verdict {
        PENDING, AC, WA, TLE, MLE, OLE, RE, CE
    }

    public record TestcaseResult(
            int testIndex,
            Verdict verdict,
            int timeMs,
            int memoryKb
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getContestId() { return contestId; }
    public void setContestId(String contestId) { this.contestId = contestId; }
    public OjProblem.ProgrammingLanguage getLanguage() { return language; }
    public void setLanguage(OjProblem.ProgrammingLanguage language) { this.language = language; }
    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Integer getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Integer executionTimeMs) { this.executionTimeMs = executionTimeMs; }
    public Integer getMemoryUsedKb() { return memoryUsedKb; }
    public void setMemoryUsedKb(Integer memoryUsedKb) { this.memoryUsedKb = memoryUsedKb; }
    public String getCompileOutput() { return compileOutput; }
    public void setCompileOutput(String compileOutput) { this.compileOutput = compileOutput; }
    public List<TestcaseResult> getTestcaseResults() { return testcaseResults; }
    public void setTestcaseResults(List<TestcaseResult> testcaseResults) { this.testcaseResults = testcaseResults; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}
