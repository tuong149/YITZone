package vn.edu.fit.yitzone.iam;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import vn.edu.fit.yitzone.iam.domain.OfficialDirectoryRoster;
import vn.edu.fit.yitzone.iam.repository.OfficialDirectoryRosterRepository;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;
import vn.edu.fit.yitzone.iam.service.OfficialDirectoryRosterService;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class OfficialDirectoryRosterServiceTest {

    @Test
    void importsCsvAndResolvesFitMajorCodeFromStudentCode() {
        OfficialDirectoryRosterRepository repo = Mockito.mock(OfficialDirectoryRosterRepository.class);
        List<OfficialDirectoryRoster> saved = new ArrayList<>();
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        when(repo.save(any(OfficialDirectoryRoster.class))).thenAnswer(inv -> {
            OfficialDirectoryRoster item = inv.getArgument(0);
            saved.add(item);
            return item;
        });

        FacultyMajorCatalogService catalog = new FacultyMajorCatalogService(null);
        OfficialDirectoryRosterService service = new OfficialDirectoryRosterService(repo, catalog, null);

        String csv = "\uFEFFemail;studentCode;fullName;className\n"
                + "22110123@student.hcmute.edu.vn;22110123;Nguyễn Văn An;22110ST1A\n"
                + "22133001@student.hcmute.edu.vn;22133001;Trần Thị Bình;22133KT1A\n";

        var summary = service.importRoster(
                new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)),
                "roster_hk1.csv",
                "2026-HK1",
                "btv-1"
        );

        assertThat(summary.importedCount()).isEqualTo(2);
        assertThat(summary.insertedCount()).isEqualTo(2);
        assertThat(saved).hasSize(2);
        assertThat(saved.get(0).getMajorCode()).isEqualTo("110");
        assertThat(saved.get(1).getMajorCode()).isEqualTo("133");
        assertThat(catalog.isFitStudentCode(saved.get(0).getStudentCode())).isTrue();
    }

    @Test
    void importsExcelXlsxRosterViaApachePoi() throws Exception {
        OfficialDirectoryRosterRepository repo = Mockito.mock(OfficialDirectoryRosterRepository.class);
        List<OfficialDirectoryRoster> saved = new ArrayList<>();
        when(repo.findByEmail(anyString())).thenReturn(Optional.empty());
        when(repo.save(any(OfficialDirectoryRoster.class))).thenAnswer(inv -> {
            OfficialDirectoryRoster item = inv.getArgument(0);
            saved.add(item);
            return item;
        });

        FacultyMajorCatalogService catalog = new FacultyMajorCatalogService(null);
        OfficialDirectoryRosterService service = new OfficialDirectoryRosterService(repo, catalog, null);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            var sheet = wb.createSheet("Roster");
            var header = sheet.createRow(0);
            header.createCell(0).setCellValue("email");
            header.createCell(1).setCellValue("studentCode");
            header.createCell(2).setCellValue("fullName");

            var row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("22162045@student.hcmute.edu.vn");
            row1.createCell(1).setCellValue("22162045");
            row1.createCell(2).setCellValue("Lê Minh Quân");
            wb.write(baos);
        }

        var summary = service.importRoster(
                new ByteArrayInputStream(baos.toByteArray()),
                "roster_2026.xlsx",
                "2026-HK1",
                "btv-1"
        );

        assertThat(summary.importedCount()).isEqualTo(1);
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getMajorCode()).isEqualTo("162");
        assertThat(catalog.isFitStudentCode(saved.get(0).getStudentCode())).isTrue();
    }
}
