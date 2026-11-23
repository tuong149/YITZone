package vn.edu.fit.yitzone.office.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.office.domain.OfficeDutyShift;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OfficeDutyShiftRepository extends MongoRepository<OfficeDutyShift, String> {
    Optional<OfficeDutyShift> findByScheduleIdAndShiftDateAndShiftCode(
            String scheduleId,
            LocalDate shiftDate,
            OfficeDutyShift.ShiftCode shiftCode
    );
    List<OfficeDutyShift> findByScheduleIdAndShiftDateBetween(String scheduleId, LocalDate start, LocalDate end);
    List<OfficeDutyShift> findByAssignedAttendeesUserIdAndShiftDateGreaterThanEqual(String userId, LocalDate fromDate);
}
