package vn.edu.fit.yitzone.iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.config.SecurityConfig;
import vn.edu.fit.yitzone.common.exception.GlobalExceptionHandler;
import vn.edu.fit.yitzone.common.security.ActiveScopeFilter;
import vn.edu.fit.yitzone.common.security.DevicePopVerifierService;
import vn.edu.fit.yitzone.common.security.JwtAuthenticationFilter;
import vn.edu.fit.yitzone.common.security.JwtTokenService;
import vn.edu.fit.yitzone.common.security.ScopedPermissionEvaluator;
import vn.edu.fit.yitzone.iam.controller.AccountAdminController;
import vn.edu.fit.yitzone.iam.controller.AuthController;
import vn.edu.fit.yitzone.iam.controller.IamController;
import vn.edu.fit.yitzone.iam.controller.RbacController;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.Role;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.OfficialDirectoryRosterRepository;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.RoleRepository;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.AccountAdminService;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;
import vn.edu.fit.yitzone.iam.service.HybridAuthService;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.IdentityResolutionService;
import vn.edu.fit.yitzone.iam.service.OfficialDirectoryRosterService;
import vn.edu.fit.yitzone.iam.service.OrgUnitService;
import vn.edu.fit.yitzone.iam.service.OtpService;
import vn.edu.fit.yitzone.iam.service.PermissionModuleService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RbacGrantService;
import vn.edu.fit.yitzone.iam.service.RefreshTokenService;
import vn.edu.fit.yitzone.iam.service.TotpMfaService;
import vn.edu.fit.yitzone.iam.service.WalkInAutoLinkService;
import vn.edu.fit.yitzone.privacy.controller.PrivacyController;
import vn.edu.fit.yitzone.privacy.domain.ConsentRecord;
import vn.edu.fit.yitzone.privacy.domain.DataPrivacyRequest;
import vn.edu.fit.yitzone.privacy.repository.ConsentRecordRepository;
import vn.edu.fit.yitzone.privacy.repository.DataPrivacyRequestRepository;
import vn.edu.fit.yitzone.privacy.service.PrivacyService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full Spring Security + MockMvc integration test covering Subsystem 4.1 controllers:
 * - AuthController HttpOnly refresh cookie lifecycle (login -> refresh rotation -> logout)
 * - @PreAuthorize enforcement across RbacController, IamController, AccountAdminController, PrivacyController
 * - X-Active-Scope-Id switching on /api/v1/iam/me and live <= 5s grant revocation (Edge 30)
 * - Privacy PDF export download endpoint
 */
@SpringJUnitWebConfig(classes = IamWebMvcSecurityIntegrationTest.TestSecurityWebConfig.class)
class IamWebMvcSecurityIntegrationTest {

    private static final String TEST_JWT_SECRET =
            "test-jwt-secret-key-at-least-64-characters-long-for-hmac-sha-256-yitzone";

    @Autowired
    private WebApplicationContext wac;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private Map<String, User> userStore;

    @Autowired
    private Map<String, UserAuthIdentity> identityStore;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RbacCacheInvalidationService rbacCacheService;

    @Autowired
    private EffectivePermissionService effectivePermissionService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity())
                .build();

        userStore.clear();
        identityStore.clear();
        Instant now = Instant.now();

        User student = new User();
        student.setId("u-student");
        student.setEmail("22110500@student.hcmute.edu.vn");
        student.setFullName("Nguyễn Sinh Viên");
        student.setStudentCode("22110500");
        student.setMajorCode("110");
        student.setPermissionVersion(1L);
        student.setRoleScopes(new ArrayList<>());
        student.setAssignedModules(new ArrayList<>(List.of(
                new User.AssignedModule("MOD_EVENT_OPS", "COMMITTEE", "EMFIT", now.plusSeconds(3600))
        )));
        userStore.put(student.getId(), student);

        UserAuthIdentity studentAuth = new UserAuthIdentity();
        studentAuth.setId("auth-student");
        studentAuth.setUserId(student.getId());
        studentAuth.setEmail(student.getEmail());
        studentAuth.setEmailVerified(true);
        studentAuth.setPasswordHash(passwordEncoder.encode("Student@2026"));
        identityStore.put(student.getId(), studentAuth);

        User btv = new User();
        btv.setId("u-btv");
        btv.setEmail("btv@hcmute.edu.vn");
        btv.setFullName("Bí thư Đoàn Khoa");
        btv.setPermissionVersion(1L);
        btv.setRoleScopes(new ArrayList<>(List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, null, "BCH_DOAN", "FACULTY", "FACULTY",
                        "2026-2027", now.minusSeconds(60), null, null)
        )));
        userStore.put(btv.getId(), btv);

        effectivePermissionService.evictLocalCache(student.getId());
        effectivePermissionService.evictLocalCache(btv.getId());
    }

    @Test
    @DisplayName("UC-IAM-03: AuthController login issues HttpOnly yitz_rt cookie, rotates on /refresh, and clears on /logout")
    void authControllerManagesHttpOnlyRefreshCookieLifecycle() throws Exception {
        MvcResult loginRes = mockMvc.perform(post("/api/v1/iam/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "22110500@student.hcmute.edu.vn",
                                  "password": "Student@2026"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("yitz_rt=")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("HttpOnly")))
                .andReturn();

        String rawRefresh1 = extractCookieValue(loginRes.getResponse().getHeader(HttpHeaders.SET_COOKIE));
        assertThat(rawRefresh1).isNotBlank();

        MvcResult refreshRes = mockMvc.perform(post("/api/v1/iam/auth/refresh")
                        .cookie(new Cookie(AuthController.REFRESH_COOKIE_NAME, rawRefresh1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        String rawRefresh2 = extractCookieValue(refreshRes.getResponse().getHeader(HttpHeaders.SET_COOKIE));
        assertThat(rawRefresh2).isNotBlank().isNotEqualTo(rawRefresh1);

        // Replaying already rotated refresh token -> 401 UNAUTHORIZED
        mockMvc.perform(post("/api/v1/iam/auth/refresh")
                        .cookie(new Cookie(AuthController.REFRESH_COOKIE_NAME, rawRefresh1)))
                .andExpect(status().isUnauthorized());

        // Logout clears cookie (Max-Age=0)
        mockMvc.perform(post("/api/v1/iam/auth/logout")
                        .cookie(new Cookie(AuthController.REFRESH_COOKIE_NAME, rawRefresh2)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test
    @DisplayName("UC-IAM-04, 09, 11: @PreAuthorize blocks normal student (403) and allows BTV (200) on privileged endpoints")
    void preAuthorizeEnforcesRoleBoundariesAcrossIamAndPrivacyControllers() throws Exception {
        String studentToken = jwtTokenService.generateAccessToken(
                "u-student", "22110500@student.hcmute.edu.vn", 1L,
                List.of("event:view"), List.of("FACULTY")
        );
        String btvToken = jwtTokenService.generateAccessToken(
                "u-btv", "btv@hcmute.edu.vn", 1L,
                List.of("ROLE_STANDING_COMMITTEE", "rbac:manage", "privacy:process_request"),
                List.of("FACULTY")
        );

        // Student blocked (403) on privileged endpoints
        mockMvc.perform(get("/api/v1/rbac/modules").header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/iam/roster").header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/iam/accounts").header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/privacy/requests").header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // BTV allowed (200)
        mockMvc.perform(get("/api/v1/rbac/modules").header(HttpHeaders.AUTHORIZATION, "Bearer " + btvToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(20));
        mockMvc.perform(get("/api/v1/iam/accounts").header(HttpHeaders.AUTHORIZATION, "Bearer " + btvToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/privacy/requests").header(HttpHeaders.AUTHORIZATION, "Bearer " + btvToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("UC-IAM-09 & UC-IAM-10 (Edge 12 & 30): X-Active-Scope-Id enforced and live grant revocation blocks next API with 403 immediately")
    void activeScopeHeaderAndImmediateRevocationBlockNextHttpRequest() throws Exception {
        String studentToken = jwtTokenService.generateAccessToken(
                "u-student", "22110500@student.hcmute.edu.vn", 1L,
                List.of("MOD_EVENT_OPS", "event:create"), List.of("FACULTY", "EMFIT")
        );
        String btvToken = jwtTokenService.generateAccessToken(
                "u-btv", "btv@hcmute.edu.vn", 1L,
                List.of("ROLE_STANDING_COMMITTEE", "rbac:manage"), List.of("FACULTY")
        );

        // 1. Valid scope EMFIT succeeds on /api/v1/iam/me; unauthorized scope OFIT returns 403
        mockMvc.perform(get("/api/v1/iam/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .header(ActiveScopeFilter.ACTIVE_SCOPE_HEADER, "EMFIT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activeScopeId").value("EMFIT"));

        mockMvc.perform(get("/api/v1/iam/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .header(ActiveScopeFilter.ACTIVE_SCOPE_HEADER, "OFIT"))
                .andExpect(status().isForbidden());

        // 2. BTV revokes MOD_EVENT_OPS on EMFIT -> immediate cache invalidation
        mockMvc.perform(delete("/api/v1/rbac/grants/u-student/MOD_EVENT_OPS")
                        .param("scopeId", "EMFIT")
                        .param("reason", "Thu hồi khẩn cấp")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + btvToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REVOKED"));

        // 3. Student's EXISTING JWT immediately loses EMFIT scope on next HTTP call (403 Forbidden, <= 5s)
        mockMvc.perform(get("/api/v1/iam/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .header(ActiveScopeFilter.ACTIVE_SCOPE_HEADER, "EMFIT"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("UC-IAM-11: PrivacyController downloads personal data export as valid PDF attachment")
    void privacyControllerDownloadsPersonalDataPdf() throws Exception {
        String studentToken = jwtTokenService.generateAccessToken(
                "u-student", "22110500@student.hcmute.edu.vn", 1L,
                List.of("event:view"), List.of("FACULTY")
        );

        MvcResult pdfRes = mockMvc.perform(get("/api/v1/privacy/my-data-exports/download")
                        .param("format", "PDF")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("attachment")))
                .andReturn();

        byte[] body = pdfRes.getResponse().getContentAsByteArray();
        assertThat(body).startsWith("%PDF".getBytes());
    }

    private String extractCookieValue(String setCookieHeader) {
        if (setCookieHeader == null) {
            return null;
        }
        String firstPart = setCookieHeader.split(";")[0];
        int eq = firstPart.indexOf('=');
        return eq > 0 ? firstPart.substring(eq + 1) : null;
    }

    @Configuration
    @EnableWebMvc
    @Import(SecurityConfig.class)
    static class TestSecurityWebConfig {

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper().registerModule(new JavaTimeModule());
        }

        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder(4);
        }

        @Bean
        Map<String, User> userStore() {
            return new ConcurrentHashMap<>();
        }

        @Bean
        Map<String, UserAuthIdentity> identityStore() {
            return new ConcurrentHashMap<>();
        }

        @Bean
        UserRepository userRepository(Map<String, User> userStore) {
            UserRepository repo = Mockito.mock(UserRepository.class);
            when(repo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(userStore.get(inv.getArgument(0))));
            when(repo.findByEmail(anyString())).thenAnswer(inv -> userStore.values().stream()
                    .filter(u -> inv.getArgument(0).equals(u.getEmail())).findFirst());
            when(repo.findByStudentCode(anyString())).thenAnswer(inv -> userStore.values().stream()
                    .filter(u -> inv.getArgument(0).equals(u.getStudentCode())).findFirst());
            when(repo.findByPersonalEmailAndPersonalEmailVerifiedTrue(anyString())).thenAnswer(inv -> userStore.values().stream()
                    .filter(u -> u.isPersonalEmailVerified() && inv.getArgument(0).equals(u.getPersonalEmail())).findFirst());
            when(repo.findAll()).thenAnswer(inv -> new ArrayList<>(userStore.values()));
            when(repo.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                userStore.put(u.getId(), u);
                return u;
            });
            return repo;
        }

        @Bean
        UserAuthIdentityRepository authIdentityRepository(Map<String, UserAuthIdentity> identityStore) {
            UserAuthIdentityRepository repo = Mockito.mock(UserAuthIdentityRepository.class);
            when(repo.findByUserId(anyString())).thenAnswer(inv -> Optional.ofNullable(identityStore.get(inv.getArgument(0))));
            when(repo.findByEmail(anyString())).thenAnswer(inv -> identityStore.values().stream()
                    .filter(i -> inv.getArgument(0).equals(i.getEmail())).findFirst());
            when(repo.findAll()).thenAnswer(inv -> new ArrayList<>(identityStore.values()));
            when(repo.save(any(UserAuthIdentity.class))).thenAnswer(inv -> {
                UserAuthIdentity id = inv.getArgument(0);
                identityStore.put(id.getUserId(), id);
                return id;
            });
            return repo;
        }

        @Bean
        OrgUnitRepository orgUnitRepository() {
            List<OrgUnit> units = new IamBootstrapSeeder(null, null, null).buildStandardOrgUnits();
            OrgUnitRepository repo = Mockito.mock(OrgUnitRepository.class);
            when(repo.findAll()).thenReturn(units);
            return repo;
        }

        @Bean
        RoleRepository roleRepository() {
            List<Role> roles = new IamBootstrapSeeder(null, null, null).buildStandardRoles();
            RoleRepository repo = Mockito.mock(RoleRepository.class);
            when(repo.findAll()).thenReturn(roles);
            return repo;
        }

        @Bean
        PermissionModuleRepository permissionModuleRepository() {
            List<PermissionModule> modules = new IamBootstrapSeeder(null, null, null).buildStandardPermissionModules();
            PermissionModuleRepository repo = Mockito.mock(PermissionModuleRepository.class);
            when(repo.findAll()).thenReturn(modules);
            when(repo.findByModuleCode(anyString())).thenAnswer(inv -> modules.stream()
                    .filter(m -> inv.getArgument(0).equals(m.getModuleCode())).findFirst());
            return repo;
        }

        @Bean
        JwtTokenService jwtTokenService() {
            return new JwtTokenService(TEST_JWT_SECRET, 900L);
        }

        @Bean
        RbacCacheInvalidationService rbacCacheInvalidationService() {
            return new RbacCacheInvalidationService(null);
        }

        @Bean
        EffectivePermissionService effectivePermissionService(
                UserRepository userRepo, RoleRepository roleRepo,
                PermissionModuleRepository modRepo, OrgUnitRepository unitRepo,
                RbacCacheInvalidationService cacheService
        ) {
            return new EffectivePermissionService(userRepo, roleRepo, modRepo, unitRepo, cacheService);
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(
                JwtTokenService jwtTokenService,
                RbacCacheInvalidationService cacheService,
                EffectivePermissionService effectivePermissionService
        ) {
            return new JwtAuthenticationFilter(jwtTokenService, cacheService, effectivePermissionService);
        }

        @Bean
        ActiveScopeFilter activeScopeFilter(ObjectMapper objectMapper, RbacCacheInvalidationService cacheService) {
            return new ActiveScopeFilter(objectMapper, cacheService);
        }

        @Bean
        ScopedPermissionEvaluator scopedPermissionEvaluator() {
            return new ScopedPermissionEvaluator();
        }

        @Bean
        GlobalExceptionHandler globalExceptionHandler() {
            return new GlobalExceptionHandler();
        }

        @Bean
        AuditLogService auditLogService() {
            return new AuditLogService(null, null);
        }

        @Bean
        RefreshTokenService refreshTokenService(ObjectMapper objectMapper) {
            return new RefreshTokenService(null, objectMapper, 604800L);
        }

        @Bean
        HybridAuthService hybridAuthService(
                UserRepository userRepo, UserAuthIdentityRepository idRepo,
                PasswordEncoder encoder, RefreshTokenService refreshService,
                JwtTokenService jwtService, EffectivePermissionService effectiveService,
                AuditLogService auditService
        ) {
            return new HybridAuthService(
                    userRepo, idRepo, null, encoder,
                    new OtpService(null, null, "no-reply@yitzone.fit.edu.vn", TEST_JWT_SECRET),
                    new TotpMfaService(TEST_JWT_SECRET),
                    refreshService, jwtService, effectiveService,
                    new IdentityResolutionService(Mockito.mock(OfficialDirectoryRosterRepository.class),
                            new FacultyMajorCatalogService(null), List.of("student.hcmute.edu.vn")),
                    new WalkInAutoLinkService(null), auditService, null
            );
        }

        @Bean
        AuthController authController(HybridAuthService hybridAuthService) {
            return new AuthController(hybridAuthService, false);
        }

        @Bean
        IamController iamController(
                JwtTokenService jwtTokenService,
                OrgUnitRepository orgUnitRepository,
                RbacCacheInvalidationService cacheService,
                UserRepository userRepository,
                UserAuthIdentityRepository idRepo,
                EffectivePermissionService effectiveService,
                Environment environment
        ) {
            FacultyMajorCatalogService majorService = new FacultyMajorCatalogService(null);
            OfficialDirectoryRosterService rosterService = new OfficialDirectoryRosterService(
                    Mockito.mock(OfficialDirectoryRosterRepository.class), majorService, null);
            return new IamController(
                    jwtTokenService, orgUnitRepository, new DevicePopVerifierService(),
                    cacheService, majorService, rosterService, userRepository, idRepo,
                    effectiveService, null, environment
            );
        }

        @Bean
        RbacController rbacController(
                OrgUnitRepository orgUnitRepository,
                PermissionModuleRepository modRepo,
                UserRepository userRepo,
                RbacCacheInvalidationService cacheService,
                EffectivePermissionService effectiveService,
                AuditLogService auditService
        ) {
            OrgUnitService orgUnitService = new OrgUnitService(orgUnitRepository);
            PermissionModuleService moduleService = new PermissionModuleService(modRepo, userRepo, effectiveService, cacheService, auditService);
            RbacGrantService grantService = new RbacGrantService(userRepo, modRepo, cacheService, effectiveService, auditService, null);
            return new RbacController(orgUnitService, moduleService, grantService, null);
        }

        @Bean
        AccountAdminController accountAdminController(
                UserRepository userRepo, UserAuthIdentityRepository idRepo,
                PasswordEncoder encoder, RbacCacheInvalidationService cacheService,
                EffectivePermissionService effectiveService, RefreshTokenService refreshService,
                AuditLogService auditService
        ) {
            return new AccountAdminController(new AccountAdminService(
                    userRepo, idRepo, encoder, cacheService, effectiveService, refreshService, auditService
            ));
        }

        @Bean
        PrivacyController privacyController(
                UserRepository userRepo, UserAuthIdentityRepository idRepo,
                RbacCacheInvalidationService cacheService, AuditLogService auditService,
                ObjectMapper objectMapper
        ) {
            ConsentRecordRepository consentRepo = Mockito.mock(ConsentRecordRepository.class);
            when(consentRepo.findByUserIdOrderByGrantedAtDesc(anyString())).thenReturn(List.<ConsentRecord>of());
            DataPrivacyRequestRepository reqRepo = Mockito.mock(DataPrivacyRequestRepository.class);
            AtomicInteger seq = new AtomicInteger(1);
            when(reqRepo.findByUserIdOrderByRequestedAtDesc(anyString())).thenReturn(List.<DataPrivacyRequest>of());
            when(reqRepo.findAll()).thenReturn(List.<DataPrivacyRequest>of());
            when(reqRepo.save(any(DataPrivacyRequest.class))).thenAnswer(inv -> {
                DataPrivacyRequest r = inv.getArgument(0);
                if (r.getId() == null) r.setId("req-" + seq.getAndIncrement());
                return r;
            });
            PrivacyService privacyService = new PrivacyService(
                    consentRepo, reqRepo, userRepo, idRepo, null, null, null, cacheService, auditService, objectMapper
            );
            return new PrivacyController(privacyService);
        }
    }
}
