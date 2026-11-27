package vn.edu.fit.yitzone.iam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionCatalog;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionTitle;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.Role;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.ExecutivePositionCatalogRepository;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.RoleRepository;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Instant;
import java.util.List;

/**
 * Idempotent bootstrap seeder for Step 0 (PLAN_4_1_IAM_YITZone.md):
 * - 1 Faculty (FIT) -> 2 Executive Bodies (BCH_DOAN, BCH_HOI) + 4 Committees (EMFIT, SV5T, OFIT, ARTIT) -> 9 Teams
 * - 8 System/Unit Roles (RoleCode)
 * - 20 Standardized Business Permission Modules (SRS Table 3.2 & 3.3B)
 */
@Service
public class IamBootstrapSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(IamBootstrapSeeder.class);

    private final OrgUnitRepository orgUnitRepository;
    private final RoleRepository roleRepository;
    private final PermissionModuleRepository permissionModuleRepository;
    private final ExecutivePositionCatalogRepository positionCatalogRepository;
    private final UserRepository userRepository;
    private final UserAuthIdentityRepository authIdentityRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;
    private final String devBtvEmail;
    private final String devSysAdminEmail;
    private final String devAdminPassword;

    public IamBootstrapSeeder(
            OrgUnitRepository orgUnitRepository,
            RoleRepository roleRepository,
            PermissionModuleRepository permissionModuleRepository
    ) {
        this(orgUnitRepository, roleRepository, permissionModuleRepository, null, null, null, null, null,
                "yit@hcmute.edu.vn", "sysadmin@fit.hcmute.edu.vn", "YitZone@Admin2026!");
    }

    @Autowired
    public IamBootstrapSeeder(
            @Autowired(required = false) OrgUnitRepository orgUnitRepository,
            @Autowired(required = false) RoleRepository roleRepository,
            @Autowired(required = false) PermissionModuleRepository permissionModuleRepository,
            @Autowired(required = false) ExecutivePositionCatalogRepository positionCatalogRepository,
            @Autowired(required = false) UserRepository userRepository,
            @Autowired(required = false) UserAuthIdentityRepository authIdentityRepository,
            @Autowired(required = false) PasswordEncoder passwordEncoder,
            @Autowired(required = false) Environment environment,
            @Value("${yitzone.bootstrap.dev-admin.btv-email:yit@hcmute.edu.vn}") String devBtvEmail,
            @Value("${yitzone.bootstrap.dev-admin.sysadmin-email:sysadmin@fit.hcmute.edu.vn}") String devSysAdminEmail,
            @Value("${yitzone.bootstrap.dev-admin.password:YitZone@Admin2026!}") String devAdminPassword
    ) {
        this.orgUnitRepository = orgUnitRepository;
        this.roleRepository = roleRepository;
        this.permissionModuleRepository = permissionModuleRepository;
        this.positionCatalogRepository = positionCatalogRepository;
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
        this.devBtvEmail = devBtvEmail;
        this.devSysAdminEmail = devSysAdminEmail;
        this.devAdminPassword = devAdminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (orgUnitRepository == null || roleRepository == null || permissionModuleRepository == null) {
            return;
        }
        try {
            seedAll();
            seedDevBootstrapAdmins();
        } catch (Exception ex) {
            log.warn("IAM bootstrap seeding skipped (database unavailable): {}", ex.getMessage());
        }
    }

    public void seedAll() {
        seedOrgUnits();
        seedPermissionModules();
        seedRoles();
        seedExecutivePositionCatalog();
    }

    private void seedExecutivePositionCatalog() {
        if (positionCatalogRepository == null) {
            return;
        }
        Instant now = Instant.now();
        int inserted = 0;
        for (ExecutivePositionTitle title : ExecutivePositionTitle.values()) {
            if (positionCatalogRepository.findByCode(title.name()).isEmpty()) {
                positionCatalogRepository.save(new ExecutivePositionCatalog(
                        title.name(),
                        title.getDisplayName(),
                        title.getOrgUnitCode(),
                        title.getRoleCode(),
                        title.getMaxQuota(),
                        true,
                        true,
                        now,
                        "SYSTEM_SEED"
                ));
                inserted++;
            }
        }
        if (inserted > 0) {
            log.info("Seeded {} standard Executive Position Titles", inserted);
        }
    }

    public List<OrgUnit> buildStandardOrgUnits() {
        OrgUnit fit = orgUnit("FIT", "FIT", "Đoàn - Hội Khoa Công nghệ Thông tin (FIT)",
                OrgUnit.UnitType.FACULTY_UNION, null, List.of(), List.of());

        OrgUnit bchDoan = orgUnit("BCH_DOAN", "BCH_DOAN", "Ban Chấp hành Đoàn Khoa CNTT",
                OrgUnit.UnitType.EXECUTIVE_BODY, "FIT", List.of("FIT"), List.of());
        OrgUnit bchHoi = orgUnit("BCH_HOI", "BCH_HOI", "Ban Chấp hành Liên Chi hội Sinh viên Khoa CNTT",
                OrgUnit.UnitType.EXECUTIVE_BODY, "FIT", List.of("FIT"), List.of());

        OrgUnit emfit = orgUnit("EMFIT", "EMFIT", "Ban Sự kiện và Truyền thông (EMFIT)",
                OrgUnit.UnitType.COMMITTEE, "FIT", List.of("FIT"), List.of("MOD_DEPT_EVENT_MEDIA"));
        OrgUnit sv5t = orgUnit("SV5T", "SV5T", "Ban Phát triển phong trào Sinh viên 5 tốt (SV5T)",
                OrgUnit.UnitType.COMMITTEE, "FIT", List.of("FIT"), List.of("MOD_DEPT_SV5T"));
        OrgUnit ofit = orgUnit("OFIT", "OFIT", "Ban Văn phòng (OFIT)",
                OrgUnit.UnitType.COMMITTEE, "FIT", List.of("FIT"), List.of("MOD_DEPT_OFFICE"));
        OrgUnit artit = orgUnit("ARTIT", "ARTIT", "Ban Văn nghệ (ARTIT)",
                OrgUnit.UnitType.COMMITTEE, "FIT", List.of("FIT"), List.of("MOD_DEPT_ARTS"));

        OrgUnit emfitTu = orgUnit("EMFIT_TU", "EMFIT_TU", "Tổ Tiếp ứng",
                OrgUnit.UnitType.TEAM, "EMFIT", List.of("FIT", "EMFIT"), List.of("MOD_DEPT_EVENT_MEDIA"));
        OrgUnit emfitVh = orgUnit("EMFIT_VH", "EMFIT_VH", "Tổ Vận hành",
                OrgUnit.UnitType.TEAM, "EMFIT", List.of("FIT", "EMFIT"), List.of("MOD_DEPT_EVENT_MEDIA"));
        OrgUnit emfitTt = orgUnit("EMFIT_TT", "EMFIT_TT", "Tổ Truyền thông",
                OrgUnit.UnitType.TEAM, "EMFIT", List.of("FIT", "EMFIT"), List.of("MOD_DEPT_EVENT_MEDIA", "MOD_CMS_EDITORIAL"));

        OrgUnit sv5tPt = orgUnit("SV5T_PT", "SV5T_PT", "Tổ Phát triển",
                OrgUnit.UnitType.TEAM, "SV5T", List.of("FIT", "SV5T"), List.of("MOD_DEPT_SV5T"));
        OrgUnit sv5tPtr = orgUnit("SV5T_PTR", "SV5T_PTR", "Tổ Phong trào",
                OrgUnit.UnitType.TEAM, "SV5T", List.of("FIT", "SV5T"), List.of("MOD_DEPT_SV5T"));

        OrgUnit ofitCm = orgUnit("OFIT_CM", "OFIT_CM", "Tổ Chuyên môn",
                OrgUnit.UnitType.TEAM, "OFIT", List.of("FIT", "OFIT"), List.of("MOD_DEPT_OFFICE"));
        OrgUnit ofitQt = orgUnit("OFIT_QT", "OFIT_QT", "Tổ Quản trị",
                OrgUnit.UnitType.TEAM, "OFIT", List.of("FIT", "OFIT"), List.of("MOD_DEPT_OFFICE"));

        OrgUnit artitH = orgUnit("ARTIT_H", "ARTIT_H", "Tổ Hát",
                OrgUnit.UnitType.TEAM, "ARTIT", List.of("FIT", "ARTIT"), List.of("MOD_DEPT_ARTS"));
        OrgUnit artitN = orgUnit("ARTIT_N", "ARTIT_N", "Tổ Nhảy",
                OrgUnit.UnitType.TEAM, "ARTIT", List.of("FIT", "ARTIT"), List.of("MOD_DEPT_ARTS"));

        return List.of(
                fit, bchDoan, bchHoi,
                emfit, sv5t, ofit, artit,
                emfitTu, emfitVh, emfitTt,
                sv5tPt, sv5tPtr,
                ofitCm, ofitQt,
                artitH, artitN
        );
    }

    public List<PermissionModule> buildStandardPermissionModules() {
        return List.of(
                // A. Internal HR Management (1 module)
                module("MOD_UNIT_HR_INTERNAL", "Quản lý Nhân sự Ban/Tổ & Thông báo CTV",
                        "Xem danh bạ, gửi thông báo nội bộ và xử lý nhân sự 3 cấp theo phạm vi đơn vị",
                        List.of("hr:directory_view", "hr:propose", "hr:execute_team", "hr:approve_committee", "hr:announce_unit"), false),

                // B. 4 CTV Department Modules (NO hr:* permissions)
                module("MOD_DEPT_EVENT_MEDIA", "Nghiệp vụ CTV Ban Sự kiện & Truyền thông",
                        "Tạo, chỉnh sửa và điểm danh sự kiện nội bộ CTV thuộc Ban EMFIT (không cộng quyền lợi)",
                        List.of("internal_event:create", "internal_event:update", "internal_event:attendance"), false),
                module("MOD_DEPT_SV5T", "Nghiệp vụ CTV Ban Phát triển Phong trào SV5T",
                        "Theo dõi tiến độ 5 tiêu chí, nhắc nhở, rà soát sơ bộ hồ sơ SV5T và sự kiện nội bộ Ban SV5T",
                        List.of("sv5t:progress_view", "sv5t:remind", "sv5t:preliminary_review",
                                "internal_event:create", "internal_event:update", "internal_event:attendance"), false),
                module("MOD_DEPT_OFFICE", "Nghiệp vụ CTV Ban Văn phòng (Trực & Kiểm kê)",
                        "Kiểm kê tài sản, lập phiếu mượn-trả, điều phối lịch trực VP và sự kiện nội bộ Ban OFIT",
                        List.of("office:asset_manage", "office:borrow_manage", "duty:schedule_manage",
                                "internal_event:create", "internal_event:update", "internal_event:attendance"), false),
                module("MOD_DEPT_ARTS", "Nghiệp vụ CTV Ban Văn nghệ (Tiết mục & File diễn)",
                        "Đăng ký và cập nhật tiết mục văn nghệ, file nhạc/LED và sự kiện nội bộ Ban ARTIT",
                        List.of("arts:act_manage", "arts:media_upload",
                                "internal_event:create", "internal_event:update", "internal_event:attendance"), false),

                // C. 2 Committee Lead Authority Modules
                module("MOD_DEPT_OFFICE_LEAD", "Thẩm quyền Trưởng/Phó Ban Văn phòng",
                        "Duyệt ngoại lệ xin vắng cận giờ (<2h), đổi ca ngoại lệ và chốt biên bản chênh lệch kiểm kê",
                        List.of("duty:approve_urgent_leave", "duty:approve_swap_exception", "office:finalize_audit_diff"), false),
                module("MOD_DEPT_ARTS_LEAD", "Thẩm quyền Trưởng/Phó Ban Văn nghệ",
                        "Chốt duyệt tiết mục sau tổng duyệt, khóa file bàn giao kỹ thuật và mở khóa khẩn cấp 20 phút",
                        List.of("arts:finalize_act", "arts:emergency_unlock"), false),

                // D. 13 Faculty Operations & Governance Modules
                module("MOD_EVENT_OPS", "Tổ chức & Điều phối Sự kiện Khoa",
                        "Lên kế hoạch sự kiện cấp Khoa, duyệt BTC, xử lý hậu kiểm điểm danh và xem DS chứng nhận",
                        List.of("event:create", "event:update", "event:manage_btc", "attendance:review_queue", "cert:view_event"), false),
                module("MOD_ATTENDANCE_STAFF", "Điểm danh & Quét Mã vạch Thẻ SV Hội trường",
                        "Chiếu QR động, tải gói soát vé offline, quét mã vạch 1D thẻ SV, tiếp nhận Walk-in và điểm danh bù",
                        List.of("attendance:open_session", "attendance:qr_display", "attendance:barcode_scan",
                                "attendance:offline_sync", "attendance:manual_override"), false),
                module("MOD_QUIZ_EXAM_HOST", "Tổ chức Minigame, Live Q&A, Voting LED & Thi Trắc nghiệm",
                        "Mở phòng Minigame, kiểm duyệt Live Q&A, điều khiển màn hình LED Voting và coi thi trắc nghiệm",
                        List.of("minigame:host", "liveqa:moderate", "voting:host", "exam:proctor", "exam:transfer_device"), false),
                module("MOD_CMS_EDITORIAL", "Biên tập & Xuất bản Bản tin Truyền thông",
                        "Soạn thảo, tiếp nhận bài cộng tác SV, biên tập, duyệt và hẹn giờ xuất bản bản tin",
                        List.of("cms:create", "cms:edit", "cms:approve", "cms:schedule_publish"), false),
                module("MOD_STORE_MANAGER", "Quản lý Bán hàng Áo khoa & Gây quỹ",
                        "Tạo đợt bán, cấu hình giá vốn/voucher, đối soát sao kê, duyệt hoàn tiền và xuất báo cáo",
                        List.of("store:campaign_manage", "store:product_manage", "store:reconcile", "store:refund_approve"), false),
                module("MOD_STORE_BOOTH", "Trực bàn Giao hàng Vật phẩm (Quét QR / Mã vạch Thẻ SV)",
                        "Xem đơn đã thanh toán/COD và quét QR đơn hàng hoặc mã vạch thẻ SV để phát hàng",
                        List.of("store:booth_lookup", "store:order_fulfill", "store:cod_collect"), false),
                module("MOD_OJ_MANAGER", "Ra đề & Tổ chức Thi Lập trình (Online Judge)",
                        "Tạo đề bài thuật toán, tải bộ testcase, mở kỳ thi ICPC/IOI và kiểm tra trùng lặp code",
                        List.of("oj:problem_manage", "oj:contest_manage", "oj:plagiarism_view"), false),
                module("MOD_YITBOT_CURATOR", "Biên soạn Tài liệu cho Trợ lý Ảo YITBot",
                        "Soạn FAQ và tải bản nháp văn bản quy chế Đoàn - Hội trình BTV phê duyệt",
                        List.of("yitbot:draft_create", "yitbot:draft_edit"), false),
                module("MOD_YITBOT_FULL", "Quản trị & Phê duyệt Dữ liệu AI YITBot",
                        "Phê duyệt tài liệu chính thức vào bộ nhớ YITBot, cấu hình ngân sách AI (Non-delegable BTV)",
                        List.of("yitbot:approve_knowledge", "yitbot:budget_config"), true),
                module("MOD_SURVEY_POLL", "Tạo Khảo sát, Bình chọn (Voting) & Lấy ý kiến Sinh viên",
                        "Thiết kế khảo sát, tạo chiến dịch Live Voting/Biểu quyết, cấu hình trọng số và xuất biên bản",
                        List.of("survey:manage", "survey:ai_summary", "voting:campaign_manage", "voting:export_minutes"), false),
                module("MOD_QA_MESSENGER", "Trực Hộp thư Hỏi - Đáp & Hỗ trợ BCH",
                        "Xem hộp thư chung BCH, tiếp nhận, xem tóm tắt hồ sơ SV tối thiểu (có Audit) và trả lời",
                        List.of("qachat:inbox_view", "qachat:claim", "qachat:reply", "qachat:student_summary"), false),
                module("MOD_AUDIT_VIEWER", "Kiểm toán Nhật ký Hệ thống (Audit Log)",
                        "Xem Nhật ký Kiểm tra Hệ thống dạng chỉ đọc (không gồm quyền giải ẩn danh Live Q&A)",
                        List.of("audit:view"), true),
                module("MOD_LIVEQA_UNMASK", "Tra cứu Danh tính Câu hỏi Ẩn danh Live Q&A",
                        "Tra cứu tài khoản gửi câu hỏi ẩn danh khi có quấy rối (ghi Audit Log; không cấp cho SystemAdmin)",
                        List.of("liveqa:unmask"), true)
        );
    }

    public List<Role> buildStandardRoles() {
        return List.of(
                role(RoleCode.COLLABORATOR, "Cộng tác viên (CTV)", null, 10,
                        List.of(),
                        List.of("hr:directory_view", "duty:self_register", "duty:self_checkin")),
                role(RoleCode.DEPUTY_TEAM_LEADER, "Tổ phó", RoleCode.COLLABORATOR, 20,
                        List.of("MOD_UNIT_HR_INTERNAL"),
                        List.of("hr:directory_view", "hr:propose", "hr:announce_unit", "duty:stats_view")),
                role(RoleCode.TEAM_LEADER, "Tổ trưởng", RoleCode.DEPUTY_TEAM_LEADER, 30,
                        List.of("MOD_UNIT_HR_INTERNAL"),
                        List.of("hr:directory_view", "hr:propose", "hr:execute_team", "hr:announce_unit", "duty:stats_view")),
                role(RoleCode.VICE_COMMITTEE_HEAD, "Phó Ban", RoleCode.COLLABORATOR, 40,
                        List.of("MOD_UNIT_HR_INTERNAL"),
                        List.of("hr:directory_view", "hr:propose", "hr:announce_unit", "duty:stats_view")),
                role(RoleCode.COMMITTEE_HEAD, "Trưởng Ban", RoleCode.VICE_COMMITTEE_HEAD, 50,
                        List.of("MOD_UNIT_HR_INTERNAL"),
                        List.of("hr:directory_view", "hr:propose", "hr:execute_team", "hr:approve_committee",
                                "hr:announce_unit", "duty:stats_view", "internal_event:approve")),
                role(RoleCode.EXECUTIVE_COMMITTEE, "Ủy viên Ban Chấp hành (BCH)", RoleCode.COMMITTEE_HEAD, 70,
                        List.of("MOD_UNIT_HR_INTERNAL", "MOD_EVENT_OPS", "MOD_ATTENDANCE_STAFF",
                                "MOD_QUIZ_EXAM_HOST", "MOD_CMS_EDITORIAL", "MOD_STORE_MANAGER",
                                "MOD_STORE_BOOTH", "MOD_OJ_MANAGER", "MOD_YITBOT_CURATOR",
                                "MOD_SURVEY_POLL", "MOD_QA_MESSENGER", "MOD_DEPT_OFFICE_LEAD", "MOD_DEPT_ARTS_LEAD"),
                        List.of("event:review", "sv5t:council_review", "rbac:grant_delegable")),
                role(RoleCode.STANDING_COMMITTEE, "Ban Thường vụ (BTV)", RoleCode.EXECUTIVE_COMMITTEE, 90,
                        List.of("MOD_UNIT_HR_INTERNAL", "MOD_DEPT_EVENT_MEDIA", "MOD_DEPT_SV5T",
                                "MOD_DEPT_OFFICE", "MOD_DEPT_ARTS", "MOD_DEPT_OFFICE_LEAD", "MOD_DEPT_ARTS_LEAD",
                                "MOD_EVENT_OPS", "MOD_ATTENDANCE_STAFF", "MOD_QUIZ_EXAM_HOST",
                                "MOD_CMS_EDITORIAL", "MOD_STORE_MANAGER", "MOD_STORE_BOOTH",
                                "MOD_OJ_MANAGER", "MOD_YITBOT_CURATOR", "MOD_YITBOT_FULL",
                                "MOD_SURVEY_POLL", "MOD_QA_MESSENGER", "MOD_AUDIT_VIEWER", "MOD_LIVEQA_UNMASK"),
                        List.of("event:approve_benefits", "cert:faculty_override", "sv5t:finalize",
                                "store:approve_bank_account", "rbac:manage", "iam:roster_import",
                                "iam:restructuring_manage", "privacy:process_request")),
                // SystemAdmin explicitly EXCLUDES MOD_LIVEQA_UNMASK per SRS FR-RBAC-02
                role(RoleCode.SYSTEM_ADMIN, "Quản trị viên Hệ thống (SystemAdmin)", null, 85,
                        List.of("MOD_AUDIT_VIEWER"),
                        List.of("rbac:manage", "iam:roster_import", "system:config"))
        );
    }

    private void seedOrgUnits() {
        int inserted = 0;
        for (OrgUnit unit : buildStandardOrgUnits()) {
            if (orgUnitRepository.findByCode(unit.getCode()).isEmpty()) {
                orgUnitRepository.save(unit);
                inserted++;
            }
        }
        if (inserted > 0) {
            log.info("Seeded {} standard OrgUnits (1 Faculty - 4 Committees - 9 Teams)", inserted);
        }
    }

    private void seedPermissionModules() {
        int inserted = 0;
        for (PermissionModule module : buildStandardPermissionModules()) {
            if (permissionModuleRepository.findByModuleCode(module.getModuleCode()).isEmpty()) {
                permissionModuleRepository.save(module);
                inserted++;
            }
        }
        if (inserted > 0) {
            log.info("Seeded {} standard Business Permission Modules", inserted);
        }
    }

    private void seedRoles() {
        int inserted = 0;
        for (Role role : buildStandardRoles()) {
            if (roleRepository.findByCode(role.getCode()).isEmpty()) {
                roleRepository.save(role);
                inserted++;
            }
        }
        if (inserted > 0) {
            log.info("Seeded {} standard Roles", inserted);
        }
    }

    public void seedDevBootstrapAdmins() {
        if (environment == null || !environment.acceptsProfiles(Profiles.of("dev"))) {
            return;
        }
        if (userRepository == null || authIdentityRepository == null || passwordEncoder == null) {
            return;
        }
        seedDevAdminAccount(
                devBtvEmail,
                "Ban Thường vụ Khoa CNTT (Dev)",
                RoleCode.STANDING_COMMITTEE,
                ExecutivePositionTitle.YOUTH_UNION_SECRETARY,
                "BCH_DOAN",
                "FACULTY",
                "FACULTY"
        );
        seedDevAdminAccount(
                devSysAdminEmail,
                "Quản trị viên Hệ thống (Dev)",
                RoleCode.SYSTEM_ADMIN,
                null,
                "FIT",
                "FACULTY",
                "FACULTY"
        );
    }

    private void seedDevAdminAccount(
            String email,
            String fullName,
            RoleCode roleCode,
            ExecutivePositionTitle positionTitle,
            String unitId,
            String scopeType,
            String scopeId
    ) {
        if (email == null || email.isBlank() || devAdminPassword == null || devAdminPassword.isBlank()) {
            return;
        }
        String normalized = email.trim().toLowerCase();
        if (userRepository.findByEmail(normalized).isPresent()) {
            return;
        }
        Instant now = Instant.now();
        User user = new User();
        user.setEmail(normalized);
        user.setFullName(fullName);
        user.setUserType(User.UserType.STAFF_LECTURER);
        user.setLifecycleStatus(User.LifecycleStatus.ACTIVE_STUDY);
        user.setMemberStatus(User.MemberStatus.ACTIVE);
        user.setPermissionVersion(1L);
        user.setRoleScopes(List.of(new User.RoleScope(
                roleCode,
                positionTitle,
                unitId,
                scopeType,
                scopeId,
                "2026-2027",
                now,
                null,
                null
        )));
        User saved = userRepository.save(user);

        UserAuthIdentity identity = new UserAuthIdentity();
        identity.setUserId(saved.getId());
        identity.setEmail(normalized);
        identity.setPasswordHash(passwordEncoder.encode(devAdminPassword));
        identity.setEmailVerified(true);
        identity.setEmailVerifiedAt(now);
        identity.setMfaTotpEnabled(false);
        identity.setPasswordUpdatedAt(now);
        authIdentityRepository.save(identity);
        log.info("Seeded dev bootstrap admin account '{}' ({})", normalized, roleCode);
    }

    private OrgUnit orgUnit(
            String id,
            String code,
            String name,
            OrgUnit.UnitType type,
            String parentId,
            List<String> ancestors,
            List<String> defaultDeptModules
    ) {
        OrgUnit unit = new OrgUnit();
        unit.setId(id);
        unit.setCode(code);
        unit.setName(name);
        unit.setUnitType(type);
        unit.setParentId(parentId);
        unit.setAncestors(List.copyOf(ancestors));
        unit.setDefaultDeptModules(List.copyOf(defaultDeptModules));
        unit.setActive(true);
        return unit;
    }

    private PermissionModule module(
            String code,
            String name,
            String description,
            List<String> permissions,
            boolean nonDelegable
    ) {
        PermissionModule module = new PermissionModule();
        module.setModuleCode(code);
        module.setName(name);
        module.setDescription(description);
        module.setIncludedPermissions(List.copyOf(permissions));
        module.setNonDelegable(nonDelegable);
        module.setSystemDefault(true);
        return module;
    }

    private Role role(
            RoleCode code,
            String name,
            RoleCode parent,
            int level,
            List<String> moduleCodes,
            List<String> permissions
    ) {
        Role role = new Role();
        role.setCode(code);
        role.setName(name);
        role.setParentRoleCode(parent);
        role.setHierarchyLevel(level);
        role.setModuleCodes(List.copyOf(moduleCodes));
        role.setPermissions(List.copyOf(permissions));
        return role;
    }
}
