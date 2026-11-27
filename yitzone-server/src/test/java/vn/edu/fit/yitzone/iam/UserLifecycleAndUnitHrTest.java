package vn.edu.fit.yitzone.iam;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import vn.edu.fit.yitzone.audit.domain.Notification;
import vn.edu.fit.yitzone.audit.repository.NotificationRepository;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.HrProposal;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.HrProposalRepository;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.CtvLifecycleService;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.OtpService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.UnitHrService;
import vn.edu.fit.yitzone.iam.service.UserLifecycleProfileService;
import vn.edu.fit.yitzone.office.domain.OfficeAsset;
import vn.edu.fit.yitzone.office.domain.OfficeDutyShift;
import vn.edu.fit.yitzone.office.repository.OfficeAssetRepository;
import vn.edu.fit.yitzone.office.repository.OfficeDutyShiftRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class UserLifecycleAndUnitHrTest {

    @Test
    void ucIam05LinksPersonalEmailViaOtpAndTransitionsToGraduated() {
        Map<String, User> users = new ConcurrentHashMap<>();
        Map<String, UserAuthIdentity> identities = new ConcurrentHashMap<>();

        User sv = new User();
        sv.setId("u-sv");
        sv.setEmail("22110123@student.hcmute.edu.vn");
        sv.setFullName("Nguyễn Văn An");
        sv.setStudentCode("22110123");
        sv.setLifecycleStatus(User.LifecycleStatus.ACTIVE_STUDY);
        users.put(sv.getId(), sv);

        UserAuthIdentity id = new UserAuthIdentity();
        id.setId("auth-sv");
        id.setUserId(sv.getId());
        id.setEmail(sv.getEmail());
        id.setEmailVerified(true);
        identities.put(sv.getId(), id);

        UserRepository userRepo = mockUserRepo(users);
        UserAuthIdentityRepository idRepo = Mockito.mock(UserAuthIdentityRepository.class);
        when(idRepo.findByUserId(anyString())).thenAnswer(inv -> Optional.ofNullable(identities.get(inv.getArgument(0))));
        when(idRepo.save(any())).thenAnswer(inv -> {
            UserAuthIdentity saved = inv.getArgument(0);
            identities.put(saved.getUserId(), saved);
            return saved;
        });

        OtpService baseOtpService = new OtpService(null, null, "no-reply@yitzone.fit.edu.vn", "pepper-test-secret");
        OtpService.GeneratedOtp fixedOtp = baseOtpService.generateOtp(UserAuthIdentity.OtpPurpose.PERSONAL_EMAIL_LINK);
        OtpService otpService = new OtpService(null, null, "no-reply@yitzone.fit.edu.vn", "pepper-test-secret") {
            @Override
            public GeneratedOtp generateOtp(UserAuthIdentity.OtpPurpose purpose) {
                return fixedOtp;
            }
        };

        UserLifecycleProfileService service = new UserLifecycleProfileService(
                userRepo, idRepo, otpService, null, new RbacCacheInvalidationService(null), null, new AuditLogService(null, null)
        );

        User updatedProfile = service.updateMyProfile(sv.getId(), new UserLifecycleProfileService.UpdateProfileRequest(
                "22110ST1A", 2022, "Chi đoàn 22110ST1A", "Chi hội 22110ST1A", LocalDate.of(2020, 3, 26), LocalDate.of(2022, 10, 1)
        ));
        assertThat(updatedProfile.getClassName()).isEqualTo("22110ST1A");
        assertThat(updatedProfile.getUnionMemberProfile().youthUnionBranch()).isEqualTo("Chi đoàn 22110ST1A");

        var otpRes = service.requestPersonalEmailLink(sv.getId(), "an.nguyen.alumni@gmail.com");
        assertThat(otpRes.status()).isEqualTo("OTP_SENT");
        assertThat(sv.isPersonalEmailVerified()).isFalse();

        var verified = service.verifyPersonalEmailOtp(sv.getId(), fixedOtp.rawCode());
        assertThat(verified.verified()).isTrue();
        assertThat(sv.isPersonalEmailVerified()).isTrue();
        assertThat(sv.getPersonalEmail()).isEqualTo("an.nguyen.alumni@gmail.com");

        User graduated = service.updateLifecycleStatus(sv.getId(), User.LifecycleStatus.GRADUATED, "Tốt nghiệp đợt 1/2026", "btv-1");
        assertThat(graduated.getLifecycleStatus()).isEqualTo(User.LifecycleStatus.GRADUATED);
    }

    @Test
    void ucIam07And08EnforcesUnitIsolationThreeTierHrAndEdge34AssetBlocker() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);
        List<OrgUnit> standardUnits = seeder.buildStandardOrgUnits();
        Instant now = Instant.now();

        Map<String, User> users = new ConcurrentHashMap<>();
        User deputyEmfitTt = userWithRole("u-deputy", "22110001", "Tổ phó Truyền thông", RoleCode.DEPUTY_TEAM_LEADER, "EMFIT_TT", now);
        User headEmfit = userWithRole("u-head-emfit", "22110002", "Trưởng Ban EMFIT", RoleCode.COMMITTEE_HEAD, "EMFIT", now);
        User ctvEmfit = userWithRole("u-ctv", "22110003", "CTV Truyền thông", RoleCode.COLLABORATOR, "EMFIT_TT", now);
        User ofitLead = userWithRole("u-ofit-lead", "22110004", "Trưởng Ban OFIT", RoleCode.COMMITTEE_HEAD, "OFIT", now);
        User newRecruit = new User();
        newRecruit.setId("u-new");
        newRecruit.setStudentCode("22110999");
        newRecruit.setEmail("22110999@student.hcmute.edu.vn");
        newRecruit.setFullName("Tân CTV");
        users.put(deputyEmfitTt.getId(), deputyEmfitTt);
        users.put(headEmfit.getId(), headEmfit);
        users.put(ctvEmfit.getId(), ctvEmfit);
        users.put(ofitLead.getId(), ofitLead);
        users.put(newRecruit.getId(), newRecruit);

        UserRepository userRepo = mockUserRepo(users);
        OrgUnitRepository unitRepo = Mockito.mock(OrgUnitRepository.class);
        when(unitRepo.findAll()).thenReturn(standardUnits);
        when(unitRepo.findById(anyString())).thenAnswer(inv -> standardUnits.stream()
                .filter(u -> inv.getArgument(0).equals(u.getId())).findFirst());
        when(unitRepo.findByCode(anyString())).thenAnswer(inv -> standardUnits.stream()
                .filter(u -> inv.getArgument(0).equals(u.getCode())).findFirst());

        Map<String, HrProposal> proposals = new ConcurrentHashMap<>();
        AtomicInteger pSeq = new AtomicInteger(1);
        HrProposalRepository proposalRepo = Mockito.mock(HrProposalRepository.class);
        when(proposalRepo.save(any(HrProposal.class))).thenAnswer(inv -> {
            HrProposal p = inv.getArgument(0);
            if (p.getId() == null) p.setId("prop-" + pSeq.getAndIncrement());
            proposals.put(p.getId(), p);
            return p;
        });
        when(proposalRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(proposals.get(inv.getArgument(0))));
        when(proposalRepo.findAll()).thenAnswer(inv -> new ArrayList<>(proposals.values()));

        OfficeAsset walkieTalkie = new OfficeAsset();
        walkieTalkie.setId("asset-1");
        walkieTalkie.setAssetCode("OFIT-WT-01");
        walkieTalkie.setName("Bộ đàm Motorola");
        walkieTalkie.setBorrowLogs(new ArrayList<>(List.of(new OfficeAsset.BorrowLog(
                "b-1", ctvEmfit.getId(), "evt-1", 1, "GOOD", now.minusSeconds(3600), null, 0, null, OfficeAsset.BorrowStatus.BORROWED
        ))));

        OfficeAssetRepository assetRepo = Mockito.mock(OfficeAssetRepository.class);
        when(assetRepo.findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(anyString(), anyList())).thenAnswer(inv -> {
            String uid = inv.getArgument(0);
            boolean match = walkieTalkie.getBorrowLogs().stream()
                    .anyMatch(l -> uid.equals(l.borrowerUserId()) && l.status() == OfficeAsset.BorrowStatus.BORROWED);
            return match ? List.of(walkieTalkie) : List.of();
        });
        when(assetRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OfficeDutyShift futureShift = new OfficeDutyShift();
        futureShift.setId("shift-1");
        futureShift.setShiftDate(LocalDate.now().plusDays(2));
        futureShift.setRegisteredUserIds(new ArrayList<>(List.of(ctvEmfit.getId())));
        futureShift.setAssignedAttendees(new ArrayList<>(List.of(
                new OfficeDutyShift.AssignedAttendee(ctvEmfit.getId(), null, null, OfficeDutyShift.DutyAttendanceStatus.PENDING, null, false, null)
        )));
        OfficeDutyShiftRepository shiftRepo = Mockito.mock(OfficeDutyShiftRepository.class);
        when(shiftRepo.findByAssignedAttendeesUserIdAndShiftDateGreaterThanEqual(anyString(), any(LocalDate.class)))
                .thenReturn(List.of(futureShift));
        when(shiftRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<Notification> savedNotifications = new ArrayList<>();
        NotificationRepository notifRepo = Mockito.mock(NotificationRepository.class);
        when(notifRepo.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            savedNotifications.add(n);
            return n;
        });

        RbacCacheInvalidationService cacheService = new RbacCacheInvalidationService(null);
        UnitHrService unitHrService = new UnitHrService(
                userRepo, unitRepo, proposalRepo, assetRepo, notifRepo, null, cacheService, new AuditLogService(null, null)
        );
        CtvLifecycleService ctvService = new CtvLifecycleService(
                userRepo, unitHrService, assetRepo, shiftRepo, notifRepo, null, cacheService, new AuditLogService(null, null)
        );

        // 1. Deputy Team Leader of EMFIT_TT is blocked (403) from viewing OFIT
        assertThatThrownBy(() -> unitHrService.listUnitMembers("OFIT", deputyEmfitTt.getId()))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        // 2. Deputy Team Leader cannot execute directly (403), must create proposal
        assertThatThrownBy(() -> unitHrService.executeDirectAction("EMFIT_TT",
                new UnitHrService.DirectHrActionRequest("22110999", HrProposal.ProposalType.ONBOARD_CTV, null, null, "test"),
                deputyEmfitTt.getId()))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        var proposal = unitHrService.createProposal("EMFIT_TT",
                new UnitHrService.CreateProposalRequest("22110999", HrProposal.ProposalType.ONBOARD_CTV, null, null, "Đề xuất tiếp nhận"),
                deputyEmfitTt.getId());
        assertThat(proposal.status()).isEqualTo(HrProposal.ProposalStatus.PENDING);

        // 3. Committee Head of EMFIT approves proposal -> newRecruit gets COLLABORATOR in EMFIT_TT
        var approved = unitHrService.reviewProposal("EMFIT", proposal.id(), true, "Đồng ý tiếp nhận", headEmfit.getId());
        assertThat(approved.status()).isEqualTo(HrProposal.ProposalStatus.APPROVED);
        assertThat(newRecruit.getRoleScopes()).anyMatch(rs -> "EMFIT_TT".equals(rs.unitId()) && rs.roleCode() == RoleCode.COLLABORATOR);

        // 4. Edge 34: Moving CTV to LEFT while holding unreturned walkie-talkie -> 409 Conflict
        assertThatThrownBy(() -> ctvService.changeCtvStatus(
                "EMFIT", ctvEmfit.getId(), User.MemberStatus.LEFT, null, "Nghỉ hoạt động", headEmfit.getId()
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

        // 5. After handing over asset to headEmfit -> succeeds, withdraws future shift, alerts OFIT & bumps permVersion
        var transition = ctvService.changeCtvStatus(
                "EMFIT", ctvEmfit.getId(), User.MemberStatus.LEFT, headEmfit.getId(), "Đã bàn giao bộ đàm", headEmfit.getId()
        );
        assertThat(transition.newStatus()).isEqualTo("LEFT");
        assertThat(transition.handedOverAssets()).isEqualTo(1);
        assertThat(transition.removedFutureShifts()).isEqualTo(1);
        assertThat(futureShift.getAssignedAttendees()).isEmpty();
        assertThat(savedNotifications).anyMatch(n -> ofitLead.getId().equals(n.getRecipientUserId())
                && n.getType() == Notification.NotificationType.DUTY_SWAP);
        assertThat(cacheService.isTokenVersionValid(ctvEmfit.getId(), 1L)).isFalse();
    }

    private User userWithRole(String id, String mssv, String name, RoleCode role, String unitId, Instant now) {
        User u = new User();
        u.setId(id);
        u.setStudentCode(mssv);
        u.setEmail(mssv + "@student.hcmute.edu.vn");
        u.setFullName(name);
        u.setMemberStatus(User.MemberStatus.ACTIVE);
        u.setPermissionVersion(1L);
        u.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(role, null, unitId, "TEAM", unitId, "2026-2027", now.minusSeconds(60), null, null)
        )));
        return u;
    }

    private UserRepository mockUserRepo(Map<String, User> users) {
        UserRepository repo = Mockito.mock(UserRepository.class);
        when(repo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(repo.findByStudentCode(anyString())).thenAnswer(inv -> users.values().stream()
                .filter(u -> inv.getArgument(0).equals(u.getStudentCode())).findFirst());
        when(repo.findByEmail(anyString())).thenAnswer(inv -> users.values().stream()
                .filter(u -> inv.getArgument(0).equals(u.getEmail())).findFirst());
        when(repo.findByPersonalEmailAndPersonalEmailVerifiedTrue(anyString())).thenAnswer(inv -> users.values().stream()
                .filter(u -> u.isPersonalEmailVerified() && inv.getArgument(0).equals(u.getPersonalEmail())).findFirst());
        when(repo.findByRoleScopesUnitId(anyString())).thenAnswer(inv -> {
            String unitId = inv.getArgument(0);
            return users.values().stream()
                    .filter(u -> u.getRoleScopes().stream().anyMatch(rs -> unitId.equals(rs.unitId())))
                    .toList();
        });
        when(repo.findByRoleScopesUnitIdIn(anyCollection())).thenAnswer(inv -> {
            Collection<String> ids = inv.getArgument(0);
            return users.values().stream()
                    .filter(u -> u.getRoleScopes().stream().anyMatch(rs -> rs.unitId() != null && ids.contains(rs.unitId())))
                    .toList();
        });
        when(repo.findAll()).thenAnswer(inv -> new ArrayList<>(users.values()));
        when(repo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            users.put(u.getId(), u);
            return u;
        });
        return repo;
    }
}
