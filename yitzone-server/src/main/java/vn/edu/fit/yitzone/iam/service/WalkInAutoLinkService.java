package vn.edu.fit.yitzone.iam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance;
import vn.edu.fit.yitzone.attendance.repository.EventAttendanceRepository;
import vn.edu.fit.yitzone.iam.domain.User;

import java.util.List;

/**
 * Automatically links walk-in physical barcode attendance records (PENDING_SSO_LINK)
 * when a student activates their trusted account matching studentCode (UC-IAM-01, UC-IAM-02, Edge 40).
 */
@Service
public class WalkInAutoLinkService {
    private static final Logger log = LoggerFactory.getLogger(WalkInAutoLinkService.class);

    private final EventAttendanceRepository eventAttendanceRepository;

    public WalkInAutoLinkService(@Autowired(required = false) EventAttendanceRepository eventAttendanceRepository) {
        this.eventAttendanceRepository = eventAttendanceRepository;
    }

    public int linkPendingAttendanceRecords(User user) {
        if (eventAttendanceRepository == null || user == null || user.getId() == null
                || user.getStudentCode() == null || user.getStudentCode().isBlank()) {
            return 0;
        }
        List<EventAttendance> pending = eventAttendanceRepository.findByStudentCodeSnapshotAndSsoLinkStatus(
                user.getStudentCode().trim(),
                EventAttendance.SsoLinkStatus.PENDING_SSO_LINK
        );
        if (pending.isEmpty()) {
            return 0;
        }
        for (EventAttendance att : pending) {
            att.setUserId(user.getId());
            att.setAttendeeKey("UID:" + user.getId());
            att.setSsoLinkStatus(EventAttendance.SsoLinkStatus.LINKED);
            att.setSsoLinkedAt(java.time.Instant.now());
            eventAttendanceRepository.save(att);
        }
        log.info("Auto-linked {} PENDING_SSO_LINK attendance records for userId={} (studentCode={})",
                pending.size(), user.getId(), user.getStudentCode());
        return pending.size();
    }
}
