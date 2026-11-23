package vn.edu.fit.yitzone.iam;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.edu.fit.yitzone.iam.domain.FacultyMajorCatalog;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class FacultyMajorCatalogServiceTest {

    @Test
    @DisplayName("FR-IAM-01: Classpath seed khoa_nganh.csv loads 42 majors across 12 faculties with exact 3 FIT majors")
    void shouldLoadDefaultSeedCatalogAndIdentifyFitMajors() {
        FacultyMajorCatalogService service = new FacultyMajorCatalogService(null);

        List<FacultyMajorCatalog> all = service.listAll(null, null);
        assertEquals(42, all.size());

        Set<String> faculties = all.stream()
                .map(FacultyMajorCatalog::getFacultyName)
                .collect(Collectors.toSet());
        assertEquals(12, faculties.size());

        List<FacultyMajorCatalog> fitMajors = service.listAll(null, true);
        Set<String> fitCodes = fitMajors.stream()
                .map(FacultyMajorCatalog::getMajorCode)
                .collect(Collectors.toSet());
        assertEquals(Set.of("110", "133", "162"), fitCodes);
    }

    @Test
    @DisplayName("FR-IAM-01: Resolves Faculty, Major, and FIT eligibility from 8-digit student code (AABBBCCC)")
    void shouldResolveMajorAndFacultyFromStudentCode() {
        FacultyMajorCatalogService service = new FacultyMajorCatalogService(null);

        Optional<FacultyMajorCatalog> itStudent = service.resolveFromStudentCode("25110001");
        assertTrue(itStudent.isPresent());
        assertEquals("110", itStudent.get().getMajorCode());
        assertEquals("Công nghệ thông tin", itStudent.get().getMajorName());
        assertEquals("Công nghệ Thông tin", itStudent.get().getFacultyName());
        assertTrue(service.isFitStudentCode("25110001"));

        Optional<FacultyMajorCatalog> ecoStudent = service.resolveFromStudentCode("25126042");
        assertTrue(ecoStudent.isPresent());
        assertEquals("Thương mại điện tử", ecoStudent.get().getMajorName());
        assertEquals("Kinh tế", ecoStudent.get().getFacultyName());
        assertFalse(service.isFitStudentCode("25126042"));

        Optional<FacultyMajorCatalog> langStudent = service.resolveFromStudentCode("24950123");
        assertTrue(langStudent.isPresent());
        assertEquals("Sư phạm Tiếng Anh", langStudent.get().getMajorName());
        assertEquals("Ngoại ngữ", langStudent.get().getFacultyName());
        assertFalse(service.isFitStudentCode("24950123"));

        assertTrue(service.resolveFromStudentCode("INVALID").isEmpty());
        assertFalse(service.isFitStudentCode("25999001"));
    }

    @Test
    @DisplayName("FR-IAM-01: Supports dynamic CSV import with UTF-8 BOM to add new FIT major without code change")
    void shouldImportUpdatedCsvWithBomAndRecognizeNewFitMajor() {
        FacultyMajorCatalogService service = new FacultyMajorCatalogService(null);

        String csvWithBom = "\uFEFFKhoa quản lý;Mã Ngành;Ngành học\n"
                + "Công nghệ Thông tin;165;Khoa học máy tính\n"
                + "Kinh tế;166;Tài chính số\n";

        int imported = service.importFromCsv(
                new ByteArrayInputStream(csvWithBom.getBytes(StandardCharsets.UTF_8)),
                "btv-admin"
        );
        assertEquals(2, imported);
        assertTrue(service.isFitStudentCode("26165009"));
        assertEquals("Khoa học máy tính", service.resolveFromStudentCode("26165009").orElseThrow().getMajorName());
        assertFalse(service.isFitStudentCode("26166010"));
        assertEquals("Tài chính số", service.resolveFromStudentCode("26166010").orElseThrow().getMajorName());
    }
}
