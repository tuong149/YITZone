package vn.edu.fit.yitzone.attendance.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance;

import java.util.List;
import java.util.Optional;

public interface EventAttendanceRepository extends MongoRepository<EventAttendance, String> {
    Optional<EventAttendance> findByEventIdAndSessionIdAndAttendeeKey(String eventId, String sessionId, String attendeeKey);
    List<EventAttendance> findByStudentCodeSnapshotAndSsoLinkStatus(String studentCodeSnapshot, EventAttendance.SsoLinkStatus ssoLinkStatus);
    List<EventAttendance> findByEventIdAndSessionIdAndCheckinDeviceTokenId(String eventId, String sessionId, String checkinDeviceTokenId);
}
