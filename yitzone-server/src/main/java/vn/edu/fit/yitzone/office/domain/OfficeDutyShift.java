package vn.edu.fit.yitzone.office.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Individual office duty shift (CA_1..CA_6 and Friday VE_SINH_VAN_PHONG) with attendance, leave/makeup, swaps, and cleaning checklist (UC-DUTY-01..05).
 */
@Document(collection = "OFFICE_DUTY_SHIFTS")
@CompoundIndexes({
        @CompoundIndex(name = "uq_duty_shift_schedule_date_code", def = "{'scheduleId': 1, 'shiftDate': 1, 'shiftCode': 1}", unique = true),
        @CompoundIndex(name = "idx_duty_shift_attendee_date", def = "{'assignedAttendees.userId': 1, 'shiftDate': 1}")
})
public class OfficeDutyShift {
    @Id
    private String id;

    private String scheduleId;
    private LocalDate shiftDate;
    private ShiftType shiftType = ShiftType.FIXED_WEEKLY;
    private ShiftCode shiftCode;
    private String startTime; // e.g. "07:30", "16:50"
    private String endTime;   // e.g. "08:30", "17:30"
    private ShiftStatus shiftStatus = ShiftStatus.ACTIVE;
    private int maxAssignees = 2;
    private List<String> registeredUserIds = new ArrayList<>();
    private List<AssignedAttendee> assignedAttendees = new ArrayList<>();
    private List<SwapRequest> swapRequests = new ArrayList<>();
    private CleaningChecklist cleaningChecklist;
    private String shiftLogbook;

    public enum ShiftType {
        FIXED_WEEKLY, OFFICE_CLEANING
    }

    public enum ShiftCode {
        CA_1, CA_2, CA_3, CA_4, CA_5, CA_6, VE_SINH_VAN_PHONG
    }

    public enum ShiftStatus {
        ACTIVE, SUSPENDED
    }

    public enum DutyAttendanceStatus {
        PENDING, ON_TIME, LATE, EXCUSED_ABSENT, UNEXCUSED_ABSENT, MISSING_CHECKOUT
    }

    public enum RequestStatus {
        PENDING, AUTO_APPROVED, APPROVED, REJECTED
    }

    public record LeaveRequest(
            String reason,
            boolean urgentException,
            String makeupShiftId,
            RequestStatus status,
            String approvedBy,
            Instant requestedAt,
            Instant resolvedAt
    ) {
    }

    public record AssignedAttendee(
            String userId,
            Instant checkinAt,
            Instant checkoutAt,
            DutyAttendanceStatus attendanceStatus,
            LeaveRequest leaveRequest,
            boolean makeupAttendee,
            String makeupForShiftId
    ) {
    }

    public record SwapRequest(
            String requesterUserId,
            String targetUserId,
            String targetShiftId,
            String reason,
            boolean targetAccepted,
            RequestStatus status,
            String approvedBy,
            Instant requestedAt
    ) {
    }

    public record CleaningChecklist(
            boolean tablesAndChairs,
            boolean floorCleaned,
            boolean shoeRackArranged,
            boolean backpackCabinetsArranged,
            boolean equipmentArranged,
            String notes,
            List<String> proofPhotos
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }
    public LocalDate getShiftDate() { return shiftDate; }
    public void setShiftDate(LocalDate shiftDate) { this.shiftDate = shiftDate; }
    public ShiftType getShiftType() { return shiftType; }
    public void setShiftType(ShiftType shiftType) { this.shiftType = shiftType; }
    public ShiftCode getShiftCode() { return shiftCode; }
    public void setShiftCode(ShiftCode shiftCode) { this.shiftCode = shiftCode; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public ShiftStatus getShiftStatus() { return shiftStatus; }
    public void setShiftStatus(ShiftStatus shiftStatus) { this.shiftStatus = shiftStatus; }
    public int getMaxAssignees() { return maxAssignees; }
    public void setMaxAssignees(int maxAssignees) { this.maxAssignees = maxAssignees; }
    public List<String> getRegisteredUserIds() { return registeredUserIds; }
    public void setRegisteredUserIds(List<String> registeredUserIds) { this.registeredUserIds = registeredUserIds; }
    public List<AssignedAttendee> getAssignedAttendees() { return assignedAttendees; }
    public void setAssignedAttendees(List<AssignedAttendee> assignedAttendees) { this.assignedAttendees = assignedAttendees; }
    public List<SwapRequest> getSwapRequests() { return swapRequests; }
    public void setSwapRequests(List<SwapRequest> swapRequests) { this.swapRequests = swapRequests; }
    public CleaningChecklist getCleaningChecklist() { return cleaningChecklist; }
    public void setCleaningChecklist(CleaningChecklist cleaningChecklist) { this.cleaningChecklist = cleaningChecklist; }
    public String getShiftLogbook() { return shiftLogbook; }
    public void setShiftLogbook(String shiftLogbook) { this.shiftLogbook = shiftLogbook; }
}
