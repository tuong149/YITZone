package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.iam.domain.OfficialDirectoryRoster;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.OfficialDirectoryRosterRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolves trusted identity attributes (studentCode, staffId, majorCode, userType) from
 * OFFICIAL_DIRECTORY_ROSTER and university email domain (UC-IAM-01, UC-IAM-02, FR-IAM-01).
 * Never trusts self-declared studentCode from client input.
 */
@Service
public class IdentityResolutionService {
    private static final Pattern STUDENT_EMAIL_PREFIX = Pattern.compile("^([0-9]{8})@student\\.hcmute\\.edu\\.vn$");

    private final OfficialDirectoryRosterRepository rosterRepository;
    private final FacultyMajorCatalogService majorCatalogService;
    private final List<String> schoolEmailDomains;

    public IdentityResolutionService(
            OfficialDirectoryRosterRepository rosterRepository,
            @Autowired(required = false) FacultyMajorCatalogService majorCatalogService,
            @Value("${yitzone.security.school-email-domains:student.hcmute.edu.vn,hcmute.edu.vn}") List<String> schoolEmailDomains
    ) {
        this.rosterRepository = rosterRepository;
        this.majorCatalogService = majorCatalogService;
        this.schoolEmailDomains = schoolEmailDomains;
    }

    public void applyTrustedIdentity(User user, String verifiedEmail, String fallbackFullName) {
        String email = verifiedEmail.trim().toLowerCase(Locale.ROOT);
        user.setEmail(email);

        Optional<OfficialDirectoryRoster> rosterOpt = rosterRepository.findByEmail(email);
        if (rosterOpt.isPresent()) {
            OfficialDirectoryRoster roster = rosterOpt.get();
            user.setUserType(roster.getUserType() != null ? roster.getUserType() : User.UserType.STUDENT);
            if (roster.getStudentCode() != null && !roster.getStudentCode().isBlank()) {
                user.setStudentCode(roster.getStudentCode().trim());
                applyCohortAndMajorFromStudentCode(user, roster.getStudentCode().trim(), roster.getMajorCode());
            } else if (roster.getMajorCode() != null && !roster.getMajorCode().isBlank()) {
                user.setMajorCode(roster.getMajorCode().trim());
            }
            if (roster.getStaffId() != null && !roster.getStaffId().isBlank()) {
                user.setStaffId(roster.getStaffId().trim());
            }
            if (roster.getFullName() != null && !roster.getFullName().isBlank()) {
                user.setFullName(roster.getFullName().trim());
            } else if (user.getFullName() == null && fallbackFullName != null) {
                user.setFullName(fallbackFullName.trim());
            }
            if (roster.getClassName() != null && !roster.getClassName().isBlank()) {
                user.setClassName(roster.getClassName().trim());
            }
            user.setTempGuestExpiresAt(null);
            return;
        }

        if (user.getFullName() == null || user.getFullName().isBlank()) {
            user.setFullName(fallbackFullName != null && !fallbackFullName.isBlank() ? fallbackFullName.trim() : email);
        }

        if (isSchoolEmail(email)) {
            Matcher matcher = STUDENT_EMAIL_PREFIX.matcher(email);
            if (matcher.matches()) {
                String studentCode = matcher.group(1);
                user.setUserType(User.UserType.STUDENT);
                user.setStudentCode(studentCode);
                applyCohortAndMajorFromStudentCode(user, studentCode, null);
            } else {
                user.setUserType(User.UserType.STAFF_LECTURER);
            }
            user.setTempGuestExpiresAt(null);
        } else {
            user.setUserType(User.UserType.TEMP_GUEST);
            if (user.getTempGuestExpiresAt() == null) {
                user.setTempGuestExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
            }
        }
    }

    public boolean isSchoolEmail(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }
        String domain = email.substring(email.indexOf('@') + 1).toLowerCase(Locale.ROOT);
        return schoolEmailDomains.stream().anyMatch(allowed -> domain.equalsIgnoreCase(allowed.trim()));
    }

    private void applyCohortAndMajorFromStudentCode(User user, String studentCode, String explicitMajorCode) {
        if (studentCode.length() == 8 && studentCode.chars().allMatch(Character::isDigit)) {
            try {
                user.setCohort(2000 + Integer.parseInt(studentCode.substring(0, 2)));
            } catch (NumberFormatException ignored) {
                // Ignore invalid cohort prefix
            }
            String majorCode = (explicitMajorCode != null && !explicitMajorCode.isBlank())
                    ? explicitMajorCode.trim()
                    : studentCode.substring(2, 5);
            user.setMajorCode(majorCode);
            if (majorCatalogService != null) {
                majorCatalogService.resolveFromStudentCode(studentCode)
                        .ifPresent(entry -> user.setMajorCode(entry.getMajorCode()));
            }
        }
    }
}
