package vn.edu.fit.yitzone.iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance;
import vn.edu.fit.yitzone.attendance.repository.EventAttendanceRepository;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.JwtTokenService;
import vn.edu.fit.yitzone.iam.domain.OfficialDirectoryRoster;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.OfficialDirectoryRosterRepository;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.RoleRepository;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;
import vn.edu.fit.yitzone.iam.service.HybridAuthService;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.IdentityResolutionService;
import vn.edu.fit.yitzone.iam.service.OtpService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RefreshTokenService;
import vn.edu.fit.yitzone.iam.service.TotpMfaService;
import vn.edu.fit.yitzone.iam.service.WalkInAutoLinkService;
import vn.edu.fit.yitzone.privacy.repository.ConsentRecordRepository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class HybridAuthAndOidcLinkingTest {
    private static final String TEST_SECRET = "test-jwt-secret-key-at-least-64-characters-long-for-hmac-sha-256-yitzone";

    private TestHarness buildHarness() {
        return buildHarness(false);
    }

    private TestHarness buildHarness(boolean enforceAdminMfa) {
        Map<String, User> usersById = new ConcurrentHashMap<>();
        Map<String, UserAuthIdentity> identitiesByUserId = new ConcurrentHashMap<>();
        AtomicInteger idSeq = new AtomicInteger(1);
        AtomicReference<String> lastOtpCode = new AtomicReference<>();

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        when(userRepo.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) u.setId("u-" + idSeq.getAndIncrement());
            usersById.put(u.getId(), u);
            return u;
        });
        when(userRepo.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(usersById.get(inv.getArgument(0))));
        when(userRepo.findByEmail(anyString())).thenAnswer(inv -> usersById.values().stream()
                .filter(u -> inv.getArgument(0).equals(u.getEmail())).findFirst());
        when(userRepo.findByPersonalEmailAndPersonalEmailVerifiedTrue(anyString())).thenAnswer(inv -> usersById.values().stream()
                .filter(u -> u.isPersonalEmailVerified() && inv.getArgument(0).equals(u.getPersonalEmail())).findFirst());

        UserAuthIdentityRepository idRepo = Mockito.mock(UserAuthIdentityRepository.class);
        when(idRepo.save(any(UserAuthIdentity.class))).thenAnswer(inv -> {
            UserAuthIdentity id = inv.getArgument(0);
            if (id.getId() == null) id.setId("auth-" + idSeq.getAndIncrement());
            identitiesByUserId.put(id.getUserId(), id);
            return id;
        });
        when(idRepo.findByUserId(anyString())).thenAnswer(inv -> Optional.ofNullable(identitiesByUserId.get(inv.getArgument(0))));
        when(idRepo.findByEmail(anyString())).thenAnswer(inv -> identitiesByUserId.values().stream()
                .filter(i -> inv.getArgument(0).equals(i.getEmail())).findFirst());
        when(idRepo.findByGoogleSub(anyString())).thenAnswer(inv -> identitiesByUserId.values().stream()
                .filter(i -> inv.getArgument(0).equals(i.getGoogleSub())).findFirst());

        OfficialDirectoryRosterRepository rosterRepo = Mockito.mock(OfficialDirectoryRosterRepository.class);
        OfficialDirectoryRoster rosterEntry = new OfficialDirectoryRoster();
        rosterEntry.setEmail("22110418@student.hcmute.edu.vn");
        rosterEntry.setStudentCode("22110418");
        rosterEntry.setFullName("Nguyễn Minh Khôi");
        rosterEntry.setMajorCode("110");
        rosterEntry.setUserType(User.UserType.STUDENT);
        when(rosterRepo.findByEmail("22110418@student.hcmute.edu.vn")).thenReturn(Optional.of(rosterEntry));

        EventAttendance pendingWalkIn = new EventAttendance();
        pendingWalkIn.setId("att-1");
        pendingWalkIn.setStudentCodeSnapshot("22110418");
        pendingWalkIn.setSsoLinkStatus(EventAttendance.SsoLinkStatus.PENDING_SSO_LINK);
        EventAttendanceRepository attRepo = Mockito.mock(EventAttendanceRepository.class);
        when(attRepo.findByStudentCodeSnapshotAndSsoLinkStatus("22110418", EventAttendance.SsoLinkStatus.PENDING_SSO_LINK))
                .thenReturn(List.of(pendingWalkIn));
        when(attRepo.save(any(EventAttendance.class))).thenAnswer(inv -> inv.getArgument(0));

        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);
        RoleRepository roleRepo = Mockito.mock(RoleRepository.class);
        PermissionModuleRepository modRepo = Mockito.mock(PermissionModuleRepository.class);
        OrgUnitRepository unitRepo = Mockito.mock(OrgUnitRepository.class);
        when(roleRepo.findAll()).thenReturn(seeder.buildStandardRoles());
        when(modRepo.findAll()).thenReturn(seeder.buildStandardPermissionModules());
        when(unitRepo.findAll()).thenReturn(seeder.buildStandardOrgUnits());

        ConsentRecordRepository consentRepo = Mockito.mock(ConsentRecordRepository.class);
        when(consentRepo.findByUserIdAndConsentTypeAndPolicyVersion(any(), any(), any())).thenReturn(Optional.empty());
        when(consentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OtpService otpService = new OtpService(null, null, "no-reply@yitzone.fit.edu.vn", TEST_SECRET) {
            @Override
            public GeneratedOtp generateOtp(UserAuthIdentity.OtpPurpose purpose) {
                GeneratedOtp generated = super.generateOtp(purpose);
                lastOtpCode.set(generated.rawCode());
                return generated;
            }
        };
        TotpMfaService mfaService = new TotpMfaService(TEST_SECRET);
        RefreshTokenService refreshService = new RefreshTokenService(null, new ObjectMapper(), 604800L);
        JwtTokenService jwtService = new JwtTokenService(TEST_SECRET, 900L);
        EffectivePermissionService effectiveService = new EffectivePermissionService(userRepo, roleRepo, modRepo, unitRepo, new RbacCacheInvalidationService(null));
        IdentityResolutionService idResService = new IdentityResolutionService(rosterRepo, new FacultyMajorCatalogService(null), List.of("student.hcmute.edu.vn", "hcmute.edu.vn"));
        WalkInAutoLinkService autoLinkService = new WalkInAutoLinkService(attRepo);

        HybridAuthService authService = new HybridAuthService(
                userRepo, idRepo, consentRepo, new BCryptPasswordEncoder(4),
                otpService, mfaService, refreshService, jwtService,
                effectiveService, idResService, autoLinkService, new AuditLogService(null, null), null, enforceAdminMfa
        );
        return new TestHarness(authService, usersById, identitiesByUserId, pendingWalkIn, mfaService, lastOtpCode);
    }

    @Test
    void googleOidcNeutralizesPreAccountTakeoverAndAutoLinksWalkInAttendance() {
        TestHarness h = buildHarness();

        // Attacker registers victim's school email with password but cannot verify OTP
        h.authService.registerWithEmail("Fake Attacker", "22110418@student.hcmute.edu.vn", "Attacker@123", true);
        UserAuthIdentity unverified = h.identitiesByUserId.values().iterator().next();
        assertThat(unverified.isEmailVerified()).isFalse();
        assertThat(unverified.getPasswordHash()).isNotNull();

        // Real student signs in with Google Workspace OIDC -> neutralizes unverified password & auto-links walk-in record
        var issued = h.authService.authenticateGoogleOidc("google-sub-418", "22110418@student.hcmute.edu.vn", "Nguyễn Minh Khôi", true);

        assertThat(issued.payload().accessToken()).isNotBlank();
        assertThat(issued.payload().studentCode()).isEqualTo("22110418");
        assertThat(unverified.isEmailVerified()).isTrue();
        assertThat(unverified.getPasswordHash()).isNull();
        assertThat(unverified.getGoogleSub()).isEqualTo("google-sub-418");
        assertThat(h.pendingWalkIn.getSsoLinkStatus()).isEqualTo(EventAttendance.SsoLinkStatus.LINKED);
        assertThat(h.pendingWalkIn.getUserId()).isEqualTo(issued.payload().userId());
    }

    @Test
    void locksOutAfterFiveFailedAttemptsAndEnforcesTotpMfaChallenge() {
        TestHarness h = buildHarness();

        var issued = h.authService.authenticateGoogleOidc("google-sub-418", "22110418@student.hcmute.edu.vn", "Nguyễn Minh Khôi", true);
        String userId = issued.payload().userId();
        h.authService.changeOrSetupPassword(userId, null, "StrongPass@2026");

        // Enable TOTP MFA
        var setup = h.authService.setupTotpMfa(userId);
        String validCode = h.mfaService.generateCode(setup.secret(), Instant.now());
        h.authService.enableTotpMfa(userId, validCode);

        // Login with correct password -> requires MFA challenge
        var mfaChallenge = h.authService.loginWithPassword("22110418@student.hcmute.edu.vn", "StrongPass@2026");
        assertThat(mfaChallenge.payload().mfaRequired()).isTrue();
        assertThat(mfaChallenge.payload().mfaChallengeToken()).isNotBlank();

        // Complete MFA challenge -> receives access + refresh token
        var verified = h.authService.verifyMfaLoginChallenge(mfaChallenge.payload().mfaChallengeToken(), validCode);
        assertThat(verified.payload().accessToken()).isNotBlank();
        assertThat(verified.refreshToken()).isNotNull();

        // 5 consecutive wrong passwords -> 429 lockout
        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> h.authService.loginWithPassword("22110418@student.hcmute.edu.vn", "Wrong@123"))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
        }
        assertThatThrownBy(() -> h.authService.loginWithPassword("22110418@student.hcmute.edu.vn", "Wrong@123"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
    }

    @Test
    void ucIam01And02VerifiesEmailOtpRosterGuestFallbackAndLinksVerifiedAccountWithGoogle() {
        TestHarness h = buildHarness();

        // 1. Missing PDPL consent -> 400 BAD_REQUEST
        assertThatThrownBy(() -> h.authService.registerWithEmail("Nguyễn Minh Khôi", "22110418@student.hcmute.edu.vn", "Strong@2026", false))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        // 2. Weak password -> 400 BAD_REQUEST
        assertThatThrownBy(() -> h.authService.registerWithEmail("Nguyễn Minh Khôi", "22110418@student.hcmute.edu.vn", "weak", true))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        // 3. Register school email + verify OTP -> auto-assigns MSSV 22110418 (FIT 110) + auto-links PENDING_SSO_LINK
        var regResult = h.authService.registerWithEmail("Nguyễn Minh Khôi", "22110418@student.hcmute.edu.vn", "Strong@2026", true);
        assertThat(regResult.status()).isEqualTo("OTP_SENT");
        var verified = h.authService.verifyRegistrationOtp("22110418@student.hcmute.edu.vn", h.lastOtpCode.get());
        String originalUserId = verified.payload().userId();
        assertThat(verified.payload().studentCode()).isEqualTo("22110418");
        assertThat(h.usersById.get(originalUserId).getMajorCode()).isEqualTo("110");
        assertThat(h.pendingWalkIn.getSsoLinkStatus()).isEqualTo(EventAttendance.SsoLinkStatus.LINKED);

        // 4. Verified Account Linking (SRS FR-IAM-01 case a): Google Workspace login merges into SAME User & keeps password
        var googleLinked = h.authService.authenticateGoogleOidc("google-sub-418", "22110418@student.hcmute.edu.vn", "Nguyễn Minh Khôi", true);
        assertThat(googleLinked.payload().userId()).isEqualTo(originalUserId);
        assertThat(h.identitiesByUserId.get(originalUserId).getGoogleSub()).isEqualTo("google-sub-418");
        assertThat(h.identitiesByUserId.get(originalUserId).getPasswordHash()).isNotNull();

        // Both password and Google login remain usable on the same User
        var pwLogin = h.authService.loginWithPassword("22110418@student.hcmute.edu.vn", "Strong@2026");
        assertThat(pwLogin.payload().userId()).isEqualTo(originalUserId);

        // 5. External email -> TEMP_GUEST without studentCode
        h.authService.registerWithEmail("Khách Mời Ngoài", "guest.speaker@gmail.com", "Guest@2026", true);
        var guestSession = h.authService.verifyRegistrationOtp("guest.speaker@gmail.com", h.lastOtpCode.get());
        User guestUser = h.usersById.get(guestSession.payload().userId());
        assertThat(guestUser.getUserType()).isEqualTo(User.UserType.TEMP_GUEST);
        assertThat(guestUser.getStudentCode()).isNull();

        // 6. Unverified OIDC email -> 401 UNAUTHORIZED
        assertThatThrownBy(() -> h.authService.authenticateGoogleOidc("google-sub-bad", "fake@student.hcmute.edu.vn", "Fake", false))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));

        // 7. Google-only existing email attempting password registration -> 409 CONFLICT guidance
        h.authService.authenticateGoogleOidc("google-sub-only", "googleonly@student.hcmute.edu.vn", "Google Only", true);
        assertThatThrownBy(() -> h.authService.registerWithEmail("Google Only", "googleonly@student.hcmute.edu.vn", "Strong@2026", true))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void ucIam03EnforcesMandatoryAdminMfaNeutralForgotPasswordAndBulkRefreshRevocation() {
        TestHarness h = buildHarness(true);

        // Create BTV user with password
        var issued = h.authService.authenticateGoogleOidc("google-sub-btv", "btv@hcmute.edu.vn", "Bí thư Đoàn Khoa", true);
        String btvId = issued.payload().userId();
        User btv = h.usersById.get(btvId);
        btv.setRoleScopes(List.of(new User.RoleScope(
                vn.edu.fit.yitzone.iam.domain.RoleCode.STANDING_COMMITTEE,
                null, "BCH_DOAN", "FACULTY", "FACULTY", "2026-2027", Instant.now().minusSeconds(60), null, null
        )));
        h.authService.changeOrSetupPassword(btvId, null, "BtvStrong@2026");

        // 1. Mandatory Admin MFA: login returns mfaSetupRequired=true
        var challenge = h.authService.loginWithPassword("btv@hcmute.edu.vn", "BtvStrong@2026");
        assertThat(challenge.payload().mfaRequired()).isTrue();
        assertThat(challenge.payload().mfaSetupRequired()).isTrue();
        assertThat(challenge.payload().mfaSecret()).isNotBlank();

        // 2. Completing MFA challenge enables MFA and issues refresh token; disabling MFA is blocked (403)
        String code = h.mfaService.generateCode(challenge.payload().mfaSecret(), Instant.now());
        var verified = h.authService.verifyMfaLoginChallenge(challenge.payload().mfaChallengeToken(), code);
        assertThat(verified.payload().accessToken()).isNotBlank();
        assertThat(h.identitiesByUserId.get(btvId).isMfaTotpEnabled()).isTrue();
        String oldRefreshToken = verified.refreshToken().rawToken();

        assertThatThrownBy(() -> h.authService.disableTotpMfa(btvId))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        // 3. Forgot password neutral for non-existent email (no exception)
        h.authService.requestPasswordReset("nonexistent.user@hcmute.edu.vn");

        // 4. Forgot + Reset password revokes all previously issued Refresh Tokens
        h.authService.requestPasswordReset("btv@hcmute.edu.vn");
        h.authService.completePasswordReset("btv@hcmute.edu.vn", h.lastOtpCode.get(), "BtvReset@2026");

        assertThatThrownBy(() -> h.authService.refreshSession(oldRefreshToken))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    private record TestHarness(
            HybridAuthService authService,
            Map<String, User> usersById,
            Map<String, UserAuthIdentity> identitiesByUserId,
            EventAttendance pendingWalkIn,
            TotpMfaService mfaService,
            AtomicReference<String> lastOtpCode
    ) {
    }
}
