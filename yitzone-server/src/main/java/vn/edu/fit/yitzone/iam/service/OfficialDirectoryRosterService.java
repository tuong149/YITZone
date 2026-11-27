package vn.edu.fit.yitzone.iam.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.OfficialDirectoryRoster;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.OfficialDirectoryRosterRepository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Imports and queries the official university student/staff directory roster (UC-IAM-04, FR-IAM-01).
 * Supports both UTF-8 CSV (comma or semicolon separated) and Excel .xlsx files via Apache POI.
 */
@Service
public class OfficialDirectoryRosterService {
    private static final Pattern STUDENT_CODE_PATTERN = Pattern.compile("^[0-9]{8}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final OfficialDirectoryRosterRepository rosterRepository;
    private final FacultyMajorCatalogService majorCatalogService;
    private final AuditLogService auditLogService;

    public OfficialDirectoryRosterService(
            OfficialDirectoryRosterRepository rosterRepository,
            FacultyMajorCatalogService majorCatalogService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.rosterRepository = rosterRepository;
        this.majorCatalogService = majorCatalogService;
        this.auditLogService = auditLogService;
    }

    public List<RosterItemDto> listRoster(String search, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 200));
        PageRequest pageable = PageRequest.of(Math.max(0, page), safeSize, Sort.by(Sort.Direction.ASC, "studentCode"));
        Page<OfficialDirectoryRoster> result = (search == null || search.isBlank())
                ? rosterRepository.findAll(pageable)
                : rosterRepository.findByEmailContainingIgnoreCaseOrStudentCodeContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                search.trim(), search.trim(), search.trim(), pageable
        );
        return result.getContent().stream().map(this::toDto).toList();
    }

    public RosterImportSummary importRoster(InputStream inputStream, String originalFileName, String term, String actorId) {
        if (inputStream == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Tệp danh sách Roster không được để trống");
        }
        String lowerName = originalFileName == null ? "" : originalFileName.toLowerCase(Locale.ROOT);
        List<RawRosterRow> rows;
        try {
            if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
                rows = parseExcel(inputStream);
            } else {
                rows = parseCsv(inputStream);
            }
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Không thể đọc tệp danh sách Roster: " + ex.getMessage());
        }

        if (rows.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Tệp danh sách Roster không có dòng dữ liệu hợp lệ");
        }

        Instant now = Instant.now();
        int inserted = 0;
        int updated = 0;
        int skipped = 0;

        for (RawRosterRow row : rows) {
            String email = normalizeEmail(row.email());
            if (email.isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
                skipped++;
                continue;
            }
            String studentCode = clean(row.studentCode());
            String staffId = clean(row.staffId());
            if (!studentCode.isEmpty() && !STUDENT_CODE_PATTERN.matcher(studentCode).matches()) {
                skipped++;
                continue;
            }

            User.UserType userType = resolveUserType(row.userType(), studentCode, staffId);
            String majorCode = clean(row.majorCode());
            if (majorCode.isEmpty() && STUDENT_CODE_PATTERN.matcher(studentCode).matches()) {
                majorCode = studentCode.substring(2, 5);
            }

            Optional<OfficialDirectoryRoster> existing = rosterRepository.findByEmail(email);
            OfficialDirectoryRoster entity = existing.orElseGet(OfficialDirectoryRoster::new);
            if (existing.isPresent()) {
                updated++;
            } else {
                inserted++;
            }

            entity.setEmail(email);
            entity.setUserType(userType);
            entity.setStudentCode(studentCode.isEmpty() ? null : studentCode);
            entity.setStaffId(staffId.isEmpty() ? null : staffId);
            entity.setFullName(clean(row.fullName()));
            entity.setClassName(clean(row.className()));
            entity.setMajorCode(majorCode.isEmpty() ? null : majorCode);
            entity.setImportedTerm(term == null || term.isBlank() ? "DEFAULT" : term.trim());
            entity.setImportedBy(actorId);
            entity.setImportedAt(now);
            rosterRepository.save(entity);
        }

        if (auditLogService != null) {
            auditLogService.record(
                    actorId,
                    null,
                    "IAM_ROSTER_IMPORT",
                    "OFFICIAL_DIRECTORY_ROSTER",
                    term == null ? "DEFAULT" : term,
                    List.of(
                            new AuditLog.ChangedField("inserted", null, inserted),
                            new AuditLog.ChangedField("updated", null, updated),
                            new AuditLog.ChangedField("skipped", null, skipped)
                    ),
                    "Import danh sách chính thức từ tệp " + (originalFileName == null ? "roster" : originalFileName),
                    null,
                    null
            );
        }

        return new RosterImportSummary(inserted + updated, inserted, updated, skipped, "IMPORTED");
    }

    private List<RawRosterRow> parseCsv(InputStream inputStream) throws IOException {
        List<RawRosterRow> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            String delimiter = null;
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    if (!line.isEmpty() && line.charAt(0) == '\uFEFF') {
                        line = line.substring(1);
                    }
                    delimiter = line.contains(";") ? ";" : ",";
                    String lower = line.toLowerCase(Locale.ROOT);
                    if (lower.contains("email") || lower.contains("mssv") || lower.contains("student")) {
                        continue;
                    }
                }
                if (line.trim().isEmpty()) {
                    continue;
                }
                String[] cols = line.split(Pattern.quote(delimiter == null ? "," : delimiter), -1);
                rows.add(mapColumns(cols));
            }
        }
        return rows;
    }

    private List<RawRosterRow> parseExcel(InputStream inputStream) throws IOException {
        List<RawRosterRow> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            if (workbook.getNumberOfSheets() == 0) {
                return rows;
            }
            Sheet sheet = workbook.getSheetAt(0);
            boolean firstRow = true;
            for (Row row : sheet) {
                String[] cols = new String[7];
                for (int i = 0; i < cols.length; i++) {
                    Cell cell = row.getCell(i);
                    cols[i] = cell == null ? "" : formatter.formatCellValue(cell).trim();
                }
                if (firstRow) {
                    firstRow = false;
                    String joined = String.join(" ", cols).toLowerCase(Locale.ROOT);
                    if (joined.contains("email") || joined.contains("mssv") || joined.contains("student")) {
                        continue;
                    }
                }
                boolean allBlank = true;
                for (String c : cols) {
                    if (!c.isBlank()) {
                        allBlank = false;
                        break;
                    }
                }
                if (!allBlank) {
                    rows.add(mapColumns(cols));
                }
            }
        }
        return rows;
    }

    /**
     * Expected column order: email, studentCode, fullName, className, majorCode, userType, staffId
     */
    private RawRosterRow mapColumns(String[] cols) {
        String email = col(cols, 0);
        String studentCode = col(cols, 1);
        String fullName = col(cols, 2);
        String className = col(cols, 3);
        String majorCode = col(cols, 4);
        String userType = col(cols, 5);
        String staffId = col(cols, 6);
        return new RawRosterRow(email, studentCode, fullName, className, majorCode, userType, staffId);
    }

    private String col(String[] cols, int idx) {
        return idx < cols.length && cols[idx] != null ? cols[idx].trim() : "";
    }

    private User.UserType resolveUserType(String rawType, String studentCode, String staffId) {
        if (rawType != null && !rawType.isBlank()) {
            try {
                return User.UserType.valueOf(rawType.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                // Fall back to inference
            }
        }
        if (!staffId.isEmpty() && studentCode.isEmpty()) {
            return User.UserType.STAFF_LECTURER;
        }
        return User.UserType.STUDENT;
    }

    private RosterItemDto toDto(OfficialDirectoryRoster entity) {
        boolean fitFaculty = false;
        if (entity.getMajorCode() != null && majorCatalogService != null) {
            fitFaculty = majorCatalogService.findByMajorCode(entity.getMajorCode())
                    .map(m -> m.isActive() && m.isFitFaculty())
                    .orElse(false);
        } else if (entity.getStudentCode() != null && majorCatalogService != null) {
            fitFaculty = majorCatalogService.isFitStudentCode(entity.getStudentCode());
        }
        String code = entity.getStudentCode() != null ? entity.getStudentCode()
                : (entity.getStaffId() != null ? entity.getStaffId() : "");
        return new RosterItemDto(
                entity.getId(),
                code,
                entity.getStudentCode(),
                entity.getStaffId(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getClassName(),
                entity.getMajorCode(),
                entity.getUserType(),
                fitFaculty,
                entity.getImportedTerm(),
                entity.getImportedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private record RawRosterRow(
            String email,
            String studentCode,
            String fullName,
            String className,
            String majorCode,
            String userType,
            String staffId
    ) {
    }

    public record RosterItemDto(
            String id,
            String code,
            String studentCode,
            String staffId,
            String fullName,
            String email,
            String className,
            String majorCode,
            User.UserType userType,
            boolean fitFaculty,
            String importedTerm,
            Instant importedAt
    ) {
    }

    public record RosterImportSummary(
            int importedCount,
            int insertedCount,
            int updatedCount,
            int skippedCount,
            String status
    ) {
    }
}
