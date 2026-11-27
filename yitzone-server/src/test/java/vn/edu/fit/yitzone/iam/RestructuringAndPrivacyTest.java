package vn.edu.fit.yitzone.iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.event.domain.Event;
import vn.edu.fit.yitzone.event.repository.EventRepository;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionCatalog;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionTitle;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.RestructuringBatch;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.ExecutivePositionCatalogRepository;
import vn.edu.fit.yitzone.iam.repository.HrProposalRepository;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.RestructuringBatchRepository;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.ExecutiveAppointmentValidator;
import vn.edu.fit.yitzone.iam.service.ExecutivePositionCatalogService;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RestructuringService;
import vn.edu.fit.yitzone.iam.service.UnitHrService;
import vn.edu.fit.yitzone.office.domain.OfficeAsset;
import vn.edu.fit.yitzone.office.repository.OfficeAssetRepository;
import vn.edu.fit.yitzone.privacy.domain.ConsentRecord;
import vn.edu.fit.yitzone.privacy.domain.DataPrivacyRequest;
import vn.edu.fit.yitzone.privacy.repository.ConsentRecordRepository;
import vn.edu.fit.yitzone.privacy.repository.DataPrivacyRequestRepository;
import vn.edu.fit.yitzone.privacy.service.PrivacyService;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class RestructuringAndPrivacyTest {

    @Test
    void ucIam06ScopedRestructuringBatchIsolatesSelectedCommitteeAndSavesTermHistory() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);
        List<OrgUnit> standardUnits = seeder.buildStandardOrgUnits();
        Instant now = Instant.now();

        Map<String, User> users = new ConcurrentHashMap<>();
        User btv = new User();
        btv.setId("u-btv");
        btv.setFullName("Bí thư Đoàn");
        btv.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.YOUTH_UNION_SECRETARY,
                        "BCH_DOAN", "FACULTY", "FACULTY", "2026-2027", now.minusSeconds(60), null, null)
        )));

        User oldEmfitHead = new User();
        oldEmfitHead.setId("u-emfit-old");
        oldEmfitHead.setStudentCode("22110111");
        oldEmfitHead.setFullName("Trưởng Ban EMFIT Cũ");
        oldEmfitHead.setPermissionVersion(1L);
        oldEmfitHead.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(RoleCode.COMMITTEE_HEAD, null, "EMFIT", "COMMITTEE", "EMFIT",
                        "2026-2027", now.minusSeconds(3600), null, null)
        )));

        User newEmfitHead = new User();
        newEmfitHead.setId("u-emfit-new");
        newEmfitHead.setStudentCode("22110222");
        newEmfitHead.setFullName("Trưởng Ban EMFIT Mới");
        newEmfitHead.setPermissionVersion(1L);
        newEmfitHead.setRoleScopes(new ArrayList<>());

        User ofitHead = new User();
        ofitHead.setId("u-ofit");
        ofitHead.setFullName("Trưởng Ban OFIT (Không bị ảnh hưởng)");
        ofitHead.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(RoleCode.COMMITTEE_HEAD, null, "OFIT", "COMMITTEE", "OFIT",
                        "2026-2027", now.minusSeconds(3600), null, null)
        )));

        users.put(btv.getId(), btv);
        users.put(oldEmfitHead.getId(), oldEmfitHead);
        users.put(newEmfitHead.getId(), newEmfitHead);
        users.put(ofitHead.getId(), ofitHead);

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        when(userRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(userRepo.findAll()).thenAnswer(inv -> new ArrayList<>(users.values()));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            users.put(u.getId(), u);
            return u;
        });

        OrgUnitRepository unitRepo = Mockito.mock(OrgUnitRepository.class);
        when(unitRepo.findAll()).thenReturn(standardUnits);
        when(unitRepo.findById(anyString())).thenAnswer(inv -> standardUnits.stream()
                .filter(u -> inv.getArgument(0).equals(u.getId())).findFirst());
        when(unitRepo.findByCode(anyString())).thenAnswer(inv -> standardUnits.stream()
                .filter(u -> inv.getArgument(0).equals(u.getCode())).findFirst());

        Map<String, RestructuringBatch> batches = new ConcurrentHashMap<>();
        AtomicInteger bSeq = new AtomicInteger(1);
        RestructuringBatchRepository batchRepo = Mockito.mock(RestructuringBatchRepository.class);
        when(batchRepo.save(any(RestructuringBatch.class))).thenAnswer(inv -> {
            RestructuringBatch b = inv.getArgument(0);
            if (b.getId() == null) b.setId("batch-" + bSeq.getAndIncrement());
            batches.put(b.getId(), b);
            return b;
        });
        when(batchRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(batches.get(inv.getArgument(0))));

        RbacCacheInvalidationService cacheService = new RbacCacheInvalidationService(null);
        UnitHrService unitHrService = new UnitHrService(
                userRepo, unitRepo, Mockito.mock(HrProposalRepository.class), null, null, null, cacheService, null
        );
        RestructuringService service = new RestructuringService(
                userRepo, unitRepo, batchRepo, new ExecutiveAppointmentValidator(), unitHrService,
                null, null, cacheService, new AuditLogService(null, null)
        );

        RestructuringBatch draft = service.createBatch(new RestructuringService.CreateBatchRequest(
                "Kiện toàn Ban EMFIT Q1/2027",
                "2026-2027",
                List.of("EMFIT"),
                List.of(
                        new RestructuringBatch.PersonnelChangeItem(
                                oldEmfitHead.getId(), RestructuringBatch.ChangeAction.RESIGN_OR_DISMISS,
                                RoleCode.COMMITTEE_HEAD, null, "EMFIT", null, null, null, "Hoàn thành nhiệm kỳ"
                        ),
                        new RestructuringBatch.PersonnelChangeItem(
                                newEmfitHead.getId(), RestructuringBatch.ChangeAction.NEW_APPOINTMENT,
                                null, null, null, RoleCode.COMMITTEE_HEAD, null, "EMFIT", "Bổ nhiệm mới"
                        )
                ),
                null
        ), btv.getId());

        var preview = service.previewDiff(draft.getId(), btv.getId());
        assertThat(preview.diffs()).hasSize(2);

        RestructuringBatch applied = service.publishBatch(draft.getId(), null, "Ban hành kiện toàn EMFIT", btv.getId());
        assertThat(applied.getStatus()).isEqualTo(RestructuringBatch.BatchStatus.APPLIED);

        // Old EMFIT head closed endAt, recorded termHistory, and invalidated cache <= 5s
        assertThat(oldEmfitHead.getRoleScopes().get(0).endAt()).isNotNull();
        assertThat(oldEmfitHead.getTermHistory()).hasSize(1);
        assertThat(cacheService.isTokenVersionValid(oldEmfitHead.getId(), 1L)).isFalse();

        // New EMFIT head appointed
        assertThat(newEmfitHead.getRoleScopes()).anyMatch(rs -> "EMFIT".equals(rs.unitId()) && rs.roleCode() == RoleCode.COMMITTEE_HEAD);

        // Unselected OFIT head completely untouched
        assertThat(ofitHead.getRoleScopes().get(0).endAt()).isNull();
    }

    @Test
    void ucIam11RecordsConsentExportsJsonAndPdfAndAnonymizesPiiWhilePreservingAudit() {
        User sv = new User();
        sv.setId("u-priv");
        sv.setEmail("22110777@student.hcmute.edu.vn");
        sv.setFullName("Lê Minh Quân");
        sv.setStudentCode("22110777");
        sv.setPersonalEmail("quan.personal@gmail.com");
        sv.setPersonalEmailVerified(true);

        UserAuthIdentity identity = new UserAuthIdentity();
        identity.setId("auth-priv");
        identity.setUserId(sv.getId());
        identity.setEmail(sv.getEmail());
        identity.setPasswordHash("hashed-pw");

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        when(userRepo.findById(sv.getId())).thenReturn(Optional.of(sv));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserAuthIdentityRepository idRepo = Mockito.mock(UserAuthIdentityRepository.class);
        when(idRepo.findByUserId(sv.getId())).thenReturn(Optional.of(identity));
        when(idRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<ConsentRecord> consents = new ArrayList<>();
        ConsentRecordRepository consentRepo = Mockito.mock(ConsentRecordRepository.class);
        when(consentRepo.findByUserIdAndConsentTypeAndPolicyVersion(any(), any(), any())).thenReturn(Optional.empty());
        when(consentRepo.save(any(ConsentRecord.class))).thenAnswer(inv -> {
            ConsentRecord c = inv.getArgument(0);
            if (c.getId() == null) c.setId("c-" + (consents.size() + 1));
            consents.add(c);
            return c;
        });
        when(consentRepo.findByUserIdOrderByGrantedAtDesc(sv.getId())).thenReturn(consents);

        Map<String, DataPrivacyRequest> requests = new ConcurrentHashMap<>();
        AtomicInteger rSeq = new AtomicInteger(1);
        DataPrivacyRequestRepository reqRepo = Mockito.mock(DataPrivacyRequestRepository.class);
        when(reqRepo.save(any(DataPrivacyRequest.class))).thenAnswer(inv -> {
            DataPrivacyRequest r = inv.getArgument(0);
            if (r.getId() == null) r.setId("req-" + rSeq.getAndIncrement());
            requests.put(r.getId(), r);
            return r;
        });
        when(reqRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(requests.get(inv.getArgument(0))));
        when(reqRepo.findByUserIdOrderByRequestedAtDesc(sv.getId())).thenAnswer(inv -> new ArrayList<>(requests.values()));

        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        PrivacyService privacyService = new PrivacyService(
                consentRepo, reqRepo, userRepo, idRepo, null, null, null,
                new RbacCacheInvalidationService(null), new AuditLogService(null, null), mapper
        );

        ConsentRecord c = privacyService.recordConsent(sv.getId(), "PDPL_BASIC", "v2026.1", true);
        assertThat(c.isGranted()).isTrue();
        assertThat(c.getConsentType()).isEqualTo(ConsentRecord.ConsentType.INITIAL_PRIVACY);

        var jsonExport = privacyService.exportPersonalData(sv.getId(), "JSON");
        assertThat(new String(jsonExport.content(), StandardCharsets.UTF_8)).contains("22110777");

        var pdfExport = privacyService.exportPersonalData(sv.getId(), "PDF");
        assertThat(pdfExport.content()).startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));

        DataPrivacyRequest erasureReq = privacyService.createPrivacyRequest(
                sv.getId(), DataPrivacyRequest.RequestType.ERASURE_ANONYMIZE, "Yêu cầu ẩn danh hóa dữ liệu cá nhân"
        );
        DataPrivacyRequest processed = privacyService.processRequest(erasureReq.getId(), true, "Đã xác minh không nợ tài sản", "u-btv");
        assertThat(processed.getStatus()).isEqualTo(DataPrivacyRequest.RequestStatus.COMPLETED);
        assertThat(sv.getLifecycleStatus()).isEqualTo(User.LifecycleStatus.ARCHIVED);
        assertThat(sv.getPersonalEmail()).isNull();
        assertThat(identity.getPasswordHash()).isNull();
    }

    @Test
    void phase1MajorUpdateAndPositionTitleCatalogCrudWork() {
        FacultyMajorCatalogService majorService = new FacultyMajorCatalogService(null);
        var updated = majorService.updateMajor("110", "Công nghệ Thông tin (Chuẩn)", null, true, false, "u-btv");
        assertThat(updated.isActive()).isFalse();
        assertThat(majorService.listAll(null, null, false)).noneMatch(m -> "110".equals(m.getMajorCode()));
        assertThat(majorService.listAll(null, null, true)).anyMatch(m -> "110".equals(m.getMajorCode()));

        Map<String, ExecutivePositionCatalog> titles = new ConcurrentHashMap<>();
        ExecutivePositionCatalogRepository titleRepo = Mockito.mock(ExecutivePositionCatalogRepository.class);
        when(titleRepo.findByCode(anyString())).thenAnswer(inv -> Optional.ofNullable(titles.get(inv.getArgument(0))));
        when(titleRepo.save(any(ExecutivePositionCatalog.class))).thenAnswer(inv -> {
            ExecutivePositionCatalog e = inv.getArgument(0);
            titles.put(e.getCode(), e);
            return e;
        });
        when(titleRepo.findAll()).thenAnswer(inv -> new ArrayList<>(titles.values()));

        ExecutivePositionCatalogService titleService = new ExecutivePositionCatalogService(titleRepo, new AuditLogService(null, null));
        var created = titleService.createTitle("CLUB_LEAD", "Chủ nhiệm CLB Học thuật", "FIT", RoleCode.TEAM_LEADER, 2, "u-btv");
        assertThat(created.getCode()).isEqualTo("CLUB_LEAD");
        var modified = titleService.updateTitle("CLUB_LEAD", "Chủ nhiệm CLB Lập trình", null, null, 3, true, "u-btv");
        assertThat(modified.getMaxQuota()).isEqualTo(3);
    }

    @Test
    void ucIam06SingleOpsHandoverWarningsAndScheduledBatchAutoExecution() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);
        List<OrgUnit> standardUnits = seeder.buildStandardOrgUnits();
        Instant now = Instant.now();

        Map<String, User> users = new ConcurrentHashMap<>();
        User btv = new User();
        btv.setId("u-btv");
        btv.setFullName("Bí thư Đoàn");
        btv.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.YOUTH_UNION_SECRETARY,
                        "BCH_DOAN", "FACULTY", "FACULTY", "2026-2027", now.minusSeconds(60), null, null)
        )));

        User emfitHead = new User();
        emfitHead.setId("u-emfit-head");
        emfitHead.setStudentCode("22110300");
        emfitHead.setFullName("Trưởng Ban EMFIT");
        emfitHead.setPermissionVersion(1L);
        emfitHead.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(RoleCode.COMMITTEE_HEAD, null, "EMFIT", "COMMITTEE", "EMFIT",
                        "2026-2027", now.minusSeconds(3600), null, null)
        )));

        User candidate = new User();
        candidate.setId("u-cand");
        candidate.setStudentCode("22110301");
        candidate.setFullName("Ứng viên Tổ trưởng");
        candidate.setPermissionVersion(1L);
        candidate.setRoleScopes(new ArrayList<>());

        users.put(btv.getId(), btv);
        users.put(emfitHead.getId(), emfitHead);
        users.put(candidate.getId(), candidate);

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        when(userRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(userRepo.findByStudentCode(anyString())).thenAnswer(inv -> users.values().stream()
                .filter(u -> inv.getArgument(0).equals(u.getStudentCode())).findFirst());
        when(userRepo.findAll()).thenAnswer(inv -> new ArrayList<>(users.values()));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            users.put(u.getId(), u);
            return u;
        });

        OrgUnitRepository unitRepo = Mockito.mock(OrgUnitRepository.class);
        when(unitRepo.findAll()).thenReturn(standardUnits);
        when(unitRepo.findById(anyString())).thenAnswer(inv -> standardUnits.stream()
                .filter(u -> inv.getArgument(0).equals(u.getId())).findFirst());
        when(unitRepo.findByCode(anyString())).thenAnswer(inv -> standardUnits.stream()
                .filter(u -> inv.getArgument(0).equals(u.getCode())).findFirst());

        OfficeAsset unreturnedAsset = new OfficeAsset();
        unreturnedAsset.setId("asset-99");
        unreturnedAsset.setAssetCode("OFIT-MIC-01");
        unreturnedAsset.setName("Micro không dây");
        unreturnedAsset.setBorrowLogs(List.of(new OfficeAsset.BorrowLog(
                "b-99", emfitHead.getId(), "evt-open", 1, "GOOD", now.minusSeconds(600), null, 0, null, OfficeAsset.BorrowStatus.BORROWED
        )));
        OfficeAssetRepository assetRepo = Mockito.mock(OfficeAssetRepository.class);
        when(assetRepo.findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(anyString(), anyList())).thenAnswer(inv -> {
            String uid = inv.getArgument(0);
            return emfitHead.getId().equals(uid) ? List.of(unreturnedAsset) : List.of();
        });

        Event ongoingEvent = new Event();
        ongoingEvent.setId("evt-open");
        ongoingEvent.setTitle("Hội thảo AI 2026");
        ongoingEvent.setStatus("PUBLISHED");
        ongoingEvent.setOrganizerUnitId("EMFIT");
        ongoingEvent.setCreatedBy(emfitHead.getId());
        EventRepository eventRepo = Mockito.mock(EventRepository.class);
        when(eventRepo.findAll()).thenReturn(List.of(ongoingEvent));

        Map<String, RestructuringBatch> batches = new ConcurrentHashMap<>();
        AtomicInteger bSeq = new AtomicInteger(1);
        RestructuringBatchRepository batchRepo = Mockito.mock(RestructuringBatchRepository.class);
        when(batchRepo.save(any(RestructuringBatch.class))).thenAnswer(inv -> {
            RestructuringBatch b = inv.getArgument(0);
            if (b.getId() == null) b.setId("sched-" + bSeq.getAndIncrement());
            batches.put(b.getId(), b);
            return b;
        });
        when(batchRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(batches.get(inv.getArgument(0))));
        when(batchRepo.findByStatusAndEffectiveAtLessThanEqual(any(), any())).thenAnswer(inv -> {
            RestructuringBatch.BatchStatus st = inv.getArgument(0);
            Instant cutoff = inv.getArgument(1);
            return batches.values().stream()
                    .filter(b -> b.getStatus() == st && b.getEffectiveAt() != null && !b.getEffectiveAt().isAfter(cutoff))
                    .toList();
        });

        RbacCacheInvalidationService cacheService = new RbacCacheInvalidationService(null);
        UnitHrService unitHrService = new UnitHrService(
                userRepo, unitRepo, Mockito.mock(HrProposalRepository.class), assetRepo, null, null, cacheService, null
        );
        RestructuringService service = new RestructuringService(
                userRepo, unitRepo, batchRepo, new ExecutiveAppointmentValidator(), unitHrService,
                eventRepo, null, cacheService, new AuditLogService(null, null)
        );

        // 1. Committee Head EMFIT appoints within EMFIT_TT, then transfers to EMFIT_SK, then dismisses
        service.appointSingle(new RestructuringService.SingleAppointmentRequest(
                "22110301", "EMFIT_TT", RoleCode.TEAM_LEADER, null, "2026-2027", null, "Bổ nhiệm Tổ trưởng TT"
        ), emfitHead.getId());
        assertThat(candidate.getRoleScopes()).anyMatch(rs -> "EMFIT_TT".equals(rs.unitId()) && rs.endAt() == null);

        service.transferSingle(new RestructuringService.SingleTransferRequest(
                "22110301", "EMFIT_TT", "EMFIT_VH", RoleCode.TEAM_LEADER, null, "2026-2027", "Điều chuyển sang Tổ VH"
        ), emfitHead.getId());
        assertThat(candidate.getTermHistory()).hasSize(1);
        assertThat(candidate.getRoleScopes()).anyMatch(rs -> "EMFIT_VH".equals(rs.unitId()) && rs.endAt() == null);

        service.dismissSingle(new RestructuringService.SingleDismissRequest(
                "22110301", "EMFIT_VH", RoleCode.TEAM_LEADER, "Hoàn thành nhiệm vụ"
        ), emfitHead.getId());
        assertThat(candidate.getTermHistory()).hasSize(2);
        assertThat(cacheService.isTokenVersionValid(candidate.getId(), 1L)).isFalse();

        // 2. Committee Head EMFIT blocked (403) from appointing in OFIT
        assertThatThrownBy(() -> service.appointSingle(new RestructuringService.SingleAppointmentRequest(
                "22110301", "OFIT", RoleCode.COLLABORATOR, null, "2026-2027", null, "Vượt Ban"
        ), emfitHead.getId()))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        // 3. Batch previewDiff reports UNRETURNED_OFFICE_ASSETS & ONGOING_MANAGED_EVENTS, and SCHEDULED batch auto-executes when due
        RestructuringBatch draft = service.createBatch(new RestructuringService.CreateBatchRequest(
                "Kiện toàn hẹn giờ EMFIT", "2026-2027", List.of("EMFIT"),
                List.of(new RestructuringBatch.PersonnelChangeItem(
                        emfitHead.getId(), RestructuringBatch.ChangeAction.RESIGN_OR_DISMISS,
                        RoleCode.COMMITTEE_HEAD, null, "EMFIT", null, null, null, "Bàn giao cuối quý"
                )),
                null
        ), btv.getId());

        var preview = service.previewDiff(draft.getId(), btv.getId());
        assertThat(preview.handoverWarnings()).extracting(RestructuringBatch.HandoverWarning::warningType)
                .contains("UNRETURNED_OFFICE_ASSETS", "ONGOING_MANAGED_EVENTS");

        RestructuringBatch scheduled = service.publishBatch(draft.getId(), now.plusSeconds(3600), "Hẹn giờ ban hành", btv.getId());
        assertThat(scheduled.getStatus()).isEqualTo(RestructuringBatch.BatchStatus.SCHEDULED);

        // Simulate time reaching effectiveAt -> scheduler applies batch
        scheduled.setEffectiveAt(now.minusSeconds(5));
        service.processDueScheduledBatches();
        assertThat(scheduled.getStatus()).isEqualTo(RestructuringBatch.BatchStatus.APPLIED);
        assertThat(emfitHead.getRoleScopes().get(0).endAt()).isNotNull();
    }

    @Test
    void ucIam11BlocksErasureWhenHoldingOfficeAssetsAndProcessesRectification() {
        User sv = new User();
        sv.setId("u-priv-debt");
        sv.setEmail("22110888@student.hcmute.edu.vn");
        sv.setFullName("Trần Thị Nợ Tài Sản");

        OfficeAsset asset = new OfficeAsset();
        asset.setId("asset-debt");
        asset.setBorrowLogs(List.of(new OfficeAsset.BorrowLog(
                "b-debt", sv.getId(), "evt-1", 1, "GOOD", Instant.now().minusSeconds(600), null, 0, null, OfficeAsset.BorrowStatus.BORROWED
        )));
        OfficeAssetRepository assetRepo = Mockito.mock(OfficeAssetRepository.class);
        when(assetRepo.findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(anyString(), anyList())).thenReturn(List.of(asset));

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        when(userRepo.findById(sv.getId())).thenReturn(Optional.of(sv));

        Map<String, DataPrivacyRequest> reqs = new ConcurrentHashMap<>();
        AtomicInteger rSeq = new AtomicInteger(1);
        DataPrivacyRequestRepository reqRepo = Mockito.mock(DataPrivacyRequestRepository.class);
        when(reqRepo.save(any(DataPrivacyRequest.class))).thenAnswer(inv -> {
            DataPrivacyRequest r = inv.getArgument(0);
            if (r.getId() == null) r.setId("pr-" + rSeq.getAndIncrement());
            reqs.put(r.getId(), r);
            return r;
        });
        when(reqRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(reqs.get(inv.getArgument(0))));

        PrivacyService privacyService = new PrivacyService(
                Mockito.mock(ConsentRecordRepository.class), reqRepo, userRepo, null, assetRepo, null, null,
                new RbacCacheInvalidationService(null), new AuditLogService(null, null),
                new ObjectMapper().registerModule(new JavaTimeModule())
        );

        // 1. ERASURE_ANONYMIZE blocked (409 CONFLICT) while holding unreturned office asset
        var erasureReq = privacyService.createPrivacyRequest(sv.getId(), DataPrivacyRequest.RequestType.ERASURE_ANONYMIZE, "Xin xóa dữ liệu");
        assertThatThrownBy(() -> privacyService.processRequest(erasureReq.getId(), true, "Duyệt thử", "u-btv"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

        // 2. RECTIFICATION request approved -> COMPLETED without wiping PII
        var rectReq = privacyService.createPrivacyRequest(sv.getId(), DataPrivacyRequest.RequestType.RECTIFICATION, "Cập nhật họ tên đúng dấu");
        var completedRect = privacyService.processRequest(rectReq.getId(), true, "Đã cập nhật hồ sơ", "u-btv");
        assertThat(completedRect.getStatus()).isEqualTo(DataPrivacyRequest.RequestStatus.COMPLETED);
        assertThat(sv.getFullName()).isEqualTo("Trần Thị Nợ Tài Sản");
    }
}

