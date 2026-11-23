package vn.edu.fit.yitzone.event.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Tracks no-show strikes per student per semester and 14-day priority registration locks (UC-EVT-05).
 */
@Document(collection = "NO_SHOW_PENALTIES")
@CompoundIndex(name = "uq_noshow_user_term", def = "{'userId': 1, 'academicYear': 1, 'semester': 1}", unique = true)
public class NoShowPenalty {
    @Id
    private String id;

    private String userId;
    private String academicYear;
    private String semester;
    private List<String> missedEventIds = new ArrayList<>();
    private int strikeCount = 0;
    private boolean locked = false;
    private Instant lockStartAt;
    private Instant lockEndAt;
    private String unlockedBy;
    private String unlockReason;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public List<String> getMissedEventIds() { return missedEventIds; }
    public void setMissedEventIds(List<String> missedEventIds) { this.missedEventIds = missedEventIds; }
    public int getStrikeCount() { return strikeCount; }
    public void setStrikeCount(int strikeCount) { this.strikeCount = strikeCount; }
    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }
    public Instant getLockStartAt() { return lockStartAt; }
    public void setLockStartAt(Instant lockStartAt) { this.lockStartAt = lockStartAt; }
    public Instant getLockEndAt() { return lockEndAt; }
    public void setLockEndAt(Instant lockEndAt) { this.lockEndAt = lockEndAt; }
    public String getUnlockedBy() { return unlockedBy; }
    public void setUnlockedBy(String unlockedBy) { this.unlockedBy = unlockedBy; }
    public String getUnlockReason() { return unlockReason; }
    public void setUnlockReason(String unlockReason) { this.unlockReason = unlockReason; }
}
