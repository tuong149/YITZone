package vn.edu.fit.yitzone.iam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.FacultyMajorCatalog;
import vn.edu.fit.yitzone.iam.repository.FacultyMajorCatalogRepository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Dynamic Faculty & Major catalog service (FR-IAM-01).
 * Seeds default 42 majors / 12 faculties from classpath seed/khoa_nganh.csv into MongoDB
 * and resolves faculty/major & FIT eligibility from 8-digit student codes (AABBBCCC).
 */
@Service
public class FacultyMajorCatalogService implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(FacultyMajorCatalogService.class);
    private static final String DEFAULT_SEED_RESOURCE = "seed/khoa_nganh.csv";
    private static final String FIT_FACULTY_NAME = "Công nghệ Thông tin";
    private static final Pattern STUDENT_CODE_PATTERN = Pattern.compile("^[0-9]{8}$");
    private static final Pattern MAJOR_CODE_PATTERN = Pattern.compile("^[0-9]{3}$");

    private final FacultyMajorCatalogRepository repository;
    private final Map<String, FacultyMajorCatalog> cacheByMajorCode = new ConcurrentHashMap<>();

    public FacultyMajorCatalogService(
            @Autowired(required = false) FacultyMajorCatalogRepository repository
    ) {
        this.repository = repository;
        loadClasspathSeedIntoCache();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository == null) {
            return;
        }
        try {
            List<FacultyMajorCatalog> existing = repository.findAll();
            if (existing.isEmpty()) {
                for (FacultyMajorCatalog entry : cacheByMajorCode.values()) {
                    repository.save(entry);
                }
                log.info("Seeded {} faculty-major entries into FACULTY_MAJOR_CATALOG", cacheByMajorCode.size());
            } else {
                cacheByMajorCode.clear();
                for (FacultyMajorCatalog entry : existing) {
                    cacheByMajorCode.put(entry.getMajorCode(), entry);
                }
                log.info("Loaded {} faculty-major entries from MongoDB FACULTY_MAJOR_CATALOG", existing.size());
            }
        } catch (Exception ex) {
            log.warn("Unable to sync FACULTY_MAJOR_CATALOG with MongoDB on startup; using classpath seed cache ({} entries): {}",
                    cacheByMajorCode.size(), ex.getMessage());
        }
    }

    public List<FacultyMajorCatalog> listAll(String facultyName, Boolean fitOnly) {
        return listAll(facultyName, fitOnly, false);
    }

    public List<FacultyMajorCatalog> listAll(String facultyName, Boolean fitOnly, boolean includeInactive) {
        List<FacultyMajorCatalog> source = loadAllEntries();
        return source.stream()
                .filter(e -> includeInactive || e.isActive())
                .filter(e -> fitOnly == null || !fitOnly || e.isFitFaculty())
                .filter(e -> facultyName == null || facultyName.isBlank()
                        || e.getFacultyName().equalsIgnoreCase(facultyName.trim()))
                .sorted(Comparator.comparing(FacultyMajorCatalog::getMajorCode))
                .toList();
    }

    public Optional<FacultyMajorCatalog> findByMajorCode(String majorCode) {
        if (majorCode == null || !MAJOR_CODE_PATTERN.matcher(majorCode.trim()).matches()) {
            return Optional.empty();
        }
        String normalized = majorCode.trim();
        if (repository != null) {
            try {
                Optional<FacultyMajorCatalog> fromDb = repository.findByMajorCode(normalized);
                if (fromDb.isPresent()) {
                    cacheByMajorCode.put(normalized, fromDb.get());
                    return fromDb;
                }
            } catch (Exception ex) {
                log.debug("Fallback to in-memory catalog cache for majorCode={}: {}", normalized, ex.getMessage());
            }
        }
        return Optional.ofNullable(cacheByMajorCode.get(normalized));
    }

    /**
     * Resolves major and faculty info from an 8-digit student code (AABBBCCC -> majorCode = BBB).
     */
    public Optional<FacultyMajorCatalog> resolveFromStudentCode(String studentCode) {
        if (studentCode == null || !STUDENT_CODE_PATTERN.matcher(studentCode.trim()).matches()) {
            return Optional.empty();
        }
        String majorCode = studentCode.trim().substring(2, 5);
        return findByMajorCode(majorCode);
    }

    public boolean isFitStudentCode(String studentCode) {
        return resolveFromStudentCode(studentCode)
                .map(entry -> entry.isActive() && entry.isFitFaculty())
                .orElse(false);
    }

    public FacultyMajorCatalog createOrUpdateMajor(String majorCode, String majorName, String facultyName, String actor) {
        return createOrUpdateMajor(majorCode, majorName, facultyName, null, true, actor);
    }

    public FacultyMajorCatalog createOrUpdateMajor(
            String majorCode,
            String majorName,
            String facultyName,
            Boolean fitFacultyOverride,
            Boolean activeOverride,
            String actor
    ) {
        String code = majorCode == null ? "" : majorCode.trim();
        String name = majorName == null ? "" : majorName.trim();
        String faculty = facultyName == null ? "" : facultyName.trim();
        if (!MAJOR_CODE_PATTERN.matcher(code).matches() || name.isEmpty() || faculty.isEmpty()) {
            throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Mã ngành phải gồm đúng 3 chữ số và không được để trống tên Ngành hoặc tên Khoa"
            );
        }
        boolean defaultFit = FIT_FACULTY_NAME.equalsIgnoreCase(faculty)
                || ("Khoa " + FIT_FACULTY_NAME).equalsIgnoreCase(faculty);
        boolean isFit = fitFacultyOverride != null ? fitFacultyOverride : defaultFit;
        boolean isActive = activeOverride != null ? activeOverride : true;
        FacultyMajorCatalog entry = new FacultyMajorCatalog(
                code,
                name,
                faculty,
                isFit,
                isActive,
                Instant.now(),
                actor
        );
        if (repository != null) {
            Optional<FacultyMajorCatalog> existing = repository.findByMajorCode(code);
            existing.ifPresent(found -> entry.setId(found.getId()));
            repository.save(entry);
        }
        cacheByMajorCode.put(code, entry);
        return entry;
    }

    public FacultyMajorCatalog updateMajor(
            String majorCode,
            String majorName,
            String facultyName,
            Boolean fitFaculty,
            Boolean active,
            String actor
    ) {
        String code = majorCode == null ? "" : majorCode.trim();
        FacultyMajorCatalog existing = findByMajorCode(code)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy mã ngành: " + code
                ));
        if (majorName != null && !majorName.isBlank()) {
            existing.setMajorName(majorName.trim());
        }
        if (facultyName != null && !facultyName.isBlank()) {
            existing.setFacultyName(facultyName.trim());
        }
        if (fitFaculty != null) {
            existing.setFitFaculty(fitFaculty);
        }
        if (active != null) {
            existing.setActive(active);
        }
        existing.setUpdatedAt(Instant.now());
        existing.setUpdatedBy(actor);
        if (repository != null) {
            repository.save(existing);
        }
        cacheByMajorCode.put(code, existing);
        return existing;
    }

    /**
     * Imports or updates majors from a semicolon-delimited UTF-8 CSV:
     * "Khoa quản lý;Mã Ngành;Ngành học".
     */
    public int importFromCsv(InputStream csvStream, String importedBy) {
        List<FacultyMajorCatalog> parsed = parseCsv(csvStream, importedBy);
        if (parsed.isEmpty()) {
            throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Tệp CSV không chứa dòng dữ liệu Khoa - Ngành hợp lệ"
            );
        }
        for (FacultyMajorCatalog entry : parsed) {
            if (repository != null) {
                Optional<FacultyMajorCatalog> existing = repository.findByMajorCode(entry.getMajorCode());
                existing.ifPresent(found -> entry.setId(found.getId()));
                repository.save(entry);
            }
            cacheByMajorCode.put(entry.getMajorCode(), entry);
        }
        return parsed.size();
    }

    private List<FacultyMajorCatalog> loadAllEntries() {
        if (repository != null) {
            try {
                List<FacultyMajorCatalog> fromDb = repository.findAll();
                if (!fromDb.isEmpty()) {
                    return fromDb;
                }
            } catch (Exception ex) {
                log.debug("Fallback to in-memory catalog cache for listAll: {}", ex.getMessage());
            }
        }
        return new ArrayList<>(cacheByMajorCode.values());
    }

    private void loadClasspathSeedIntoCache() {
        ClassPathResource resource = new ClassPathResource(DEFAULT_SEED_RESOURCE);
        if (!resource.exists()) {
            log.warn("Default faculty-major seed resource '{}' not found on classpath", DEFAULT_SEED_RESOURCE);
            return;
        }
        try (InputStream is = resource.getInputStream()) {
            List<FacultyMajorCatalog> entries = parseCsv(is, "SYSTEM_SEED");
            for (FacultyMajorCatalog entry : entries) {
                cacheByMajorCode.put(entry.getMajorCode(), entry);
            }
        } catch (IOException ex) {
            log.warn("Failed to read default faculty-major seed '{}': {}", DEFAULT_SEED_RESOURCE, ex.getMessage());
        }
    }

    private List<FacultyMajorCatalog> parseCsv(InputStream inputStream, String actor) {
        List<FacultyMajorCatalog> result = new ArrayList<>();
        Instant now = Instant.now();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    // Strip UTF-8 BOM if present
                    if (!line.isEmpty() && line.charAt(0) == '\uFEFF') {
                        line = line.substring(1);
                    }
                    // Skip header row
                    if (line.toLowerCase(Locale.ROOT).contains("mã ngành")
                            || line.toLowerCase(Locale.ROOT).contains("khoa quản lý")) {
                        continue;
                    }
                }
                String trimmed = line.trim();
                if (trimmed.isEmpty()) {
                    continue;
                }
                String[] cols = trimmed.split(";", -1);
                if (cols.length < 3) {
                    throw new BusinessException(
                            ErrorCode.BAD_REQUEST,
                            HttpStatus.BAD_REQUEST,
                            "Dòng CSV sai định dạng (yêu cầu 3 cột ngăn cách bởi ';'): " + trimmed
                    );
                }
                String facultyName = cols[0].trim();
                String majorCode = cols[1].trim();
                String majorName = cols[2].trim();

                if (facultyName.isEmpty() || majorName.isEmpty() || !MAJOR_CODE_PATTERN.matcher(majorCode).matches()) {
                    throw new BusinessException(
                            ErrorCode.BAD_REQUEST,
                            HttpStatus.BAD_REQUEST,
                            "Mã ngành phải gồm đúng 3 chữ số và không được để trống tên Khoa/Ngành: " + trimmed
                    );
                }
                boolean isFit = FIT_FACULTY_NAME.equalsIgnoreCase(facultyName);
                result.add(new FacultyMajorCatalog(
                        majorCode,
                        majorName,
                        facultyName,
                        isFit,
                        true,
                        now,
                        actor
                ));
            }
        } catch (IOException ex) {
            throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Không thể đọc tệp CSV danh mục Khoa - Ngành: " + ex.getMessage()
            );
        }
        return result;
    }
}
