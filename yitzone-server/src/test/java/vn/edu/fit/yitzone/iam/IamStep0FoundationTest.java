package vn.edu.fit.yitzone.iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionTitle;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.Role;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.service.ExecutiveAppointmentValidator;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.OtpService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RefreshTokenService;
import vn.edu.fit.yitzone.iam.service.TotpMfaService;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class IamStep0FoundationTest {

    @Test
    void bootstrapSeederEnforcesOrgTreeAnd20PermissionModuleInvariants() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);

        List<OrgUnit> units = seeder.buildStandardOrgUnits();
        assertEquals(16, units.size(), "1 Faculty + 2 Executive Bodies (BCH_DOAN, BCH_HOI) + 4 Committees + 9 Teams = 16 OrgUnits");
        assertEquals(2, units.stream().filter(u -> u.getUnitType() == OrgUnit.UnitType.EXECUTIVE_BODY).count());
        assertEquals(4, units.stream().filter(u -> u.getUnitType() == OrgUnit.UnitType.COMMITTEE).count());
        assertEquals(9, units.stream().filter(u -> u.getUnitType() == OrgUnit.UnitType.TEAM).count());

        OrgUnit emfitMediaTeam = units.stream()
                .filter(u -> "EMFIT_TT".equals(u.getCode()))
                .findFirst()
                .orElseThrow();
        assertEquals(List.of("FIT", "EMFIT"), emfitMediaTeam.getAncestors());

        List<PermissionModule> modules = seeder.buildStandardPermissionModules();
        assertEquals(20, modules.size(), "Must define exactly 20 standardized Business Permission Modules");

        // Sensitive permissions must appear in at most ONE module
        for (String sensitive : Set.of("liveqa:moderate", "voting:host", "liveqa:unmask")) {
            long count = modules.stream()
                    .filter(m -> m.getIncludedPermissions().contains(sensitive))
                    .count();
            assertEquals(1L, count, "Sensitive permission must belong to exactly 1 module: " + sensitive);
        }

        // 4 MOD_DEPT_* CTV modules must NOT contain hr:* permissions
        modules.stream()
                .filter(m -> m.getModuleCode().startsWith("MOD_DEPT_") && !m.getModuleCode().endsWith("_LEAD"))
                .forEach(m -> assertTrue(
                        m.getIncludedPermissions().stream().noneMatch(p -> p.startsWith("hr:")),
                        "Department CTV module must not contain HR permissions: " + m.getModuleCode()
                ));

        // MOD_YITBOT_FULL must be non-delegable
        PermissionModule yitbotFull = modules.stream()
                .filter(m -> "MOD_YITBOT_FULL".equals(m.getModuleCode()))
                .findFirst()
                .orElseThrow();
        assertTrue(yitbotFull.isNonDelegable());

        // SYSTEM_ADMIN must NOT hold MOD_LIVEQA_UNMASK
        List<Role> roles = seeder.buildStandardRoles();
        assertEquals(8, roles.size());
        Role sysAdmin = roles.stream()
                .filter(r -> r.getCode() == RoleCode.SYSTEM_ADMIN)
                .findFirst()
                .orElseThrow();
        assertFalse(sysAdmin.getModuleCodes().contains("MOD_LIVEQA_UNMASK"));
        assertTrue(sysAdmin.getModuleCodes().contains("MOD_AUDIT_VIEWER"));
    }

    @Test
    void otpServiceGeneratesHashesAndVerifies6DigitCodes() {
        OtpService otpService = new OtpService(null, null, "no-reply@yitzone.fit.edu.vn", "test-pepper-secret");
        OtpService.GeneratedOtp otp = otpService.generateOtp(
                vn.edu.fit.yitzone.iam.domain.UserAuthIdentity.OtpPurpose.EMAIL_REGISTER_VERIFY
        );

        assertTrue(otp.rawCode().matches("^\\d{6}$"));
        assertTrue(otpService.verifyOtp(otp.rawCode(), otp.otpHash(), otp.expiresAt()));
        assertFalse(otpService.verifyOtp("000000".equals(otp.rawCode()) ? "111111" : "000000", otp.otpHash(), otp.expiresAt()));
        assertFalse(otpService.verifyOtp(otp.rawCode(), otp.otpHash(), Instant.now().minusSeconds(1)));
    }

    @Test
    void totpMfaServiceGeneratesVerifiesAndEncryptsSecret() {
        TotpMfaService totp = new TotpMfaService("test-master-secret-32-chars-minimum");
        String secret = totp.generateBase32Secret();
        Instant now = Instant.ofEpochSecond(1_700_000_000L);

        String code = totp.generateCode(secret, now);
        assertTrue(code.matches("^\\d{6}$"));
        assertTrue(totp.verifyCode(secret, code, now));
        assertTrue(totp.verifyCode(secret, code, now.plusSeconds(25)));
        assertFalse(totp.verifyCode(secret, code, now.plusSeconds(120)));

        String uri = totp.buildOtpAuthUri("btv@fit.edu.vn", secret);
        assertTrue(uri.startsWith("otpauth://totp/YITZone:"));
        assertTrue(uri.contains("secret=" + secret));

        String encrypted = totp.encryptSecret(secret);
        assertNotEquals(secret, encrypted);
        assertEquals(secret, totp.decryptSecret(encrypted));
    }

    @Test
    void refreshTokenServiceEnforcesIdleTimeoutRotationAndBulkRevocation() {
        RefreshTokenService service = new RefreshTokenService(null, new ObjectMapper(), 604800L);

        RefreshTokenService.IssuedRefreshToken adminToken = service.issueRefreshToken("btv-1", 1L, true);
        assertEquals(1800L, adminToken.ttlSeconds(), "Admin idle timeout must be <= 30 minutes (1800s)");

        RefreshTokenService.IssuedRefreshToken studentToken = service.issueRefreshToken("sv-1", 1L, false);
        assertEquals(604800L, studentToken.ttlSeconds(), "Student idle timeout must be <= 7 days (604800s)");

        // Single-use rotation succeeds once, then replay is rejected
        RefreshTokenService.RotatedSession rotated = service.rotateRefreshToken(studentToken.rawToken(), 1L);
        assertEquals("sv-1", rotated.userId());
        assertThrows(BusinessException.class, () -> service.rotateRefreshToken(studentToken.rawToken(), 1L));

        // Bulk revocation after password change rejects previously issued tokens
        service.revokeAllUserTokens("sv-1", 2L);
        assertThrows(BusinessException.class, () -> service.rotateRefreshToken(rotated.nextToken().rawToken(), 2L));
    }

    @Test
    void auditLogServiceBuildsTamperEvidentHashChain() {
        AuditLogService auditLogService = new AuditLogService(null, null);

        AuditLog first = auditLogService.record(
                "btv-1", "btv@fit.edu.vn", "RBAC_GRANT", "User", "sv-1",
                List.of(new AuditLog.ChangedField("assignedModules", null, "MOD_EVENT_OPS")),
                "Cấp quyền Trưởng BTC", "127.0.0.1", "JUnit"
        );
        AuditLog second = auditLogService.record(
                "btv-1", "btv@fit.edu.vn", "RBAC_REVOKE", "User", "sv-1",
                List.of(new AuditLog.ChangedField("assignedModules", "MOD_EVENT_OPS", null)),
                "Thu hồi quyền", "127.0.0.1", "JUnit"
        );

        assertEquals(1L, first.getSeq());
        assertEquals("GENESIS", first.getPrevHash());
        assertNotNull(first.getCurrentHash());
        assertEquals(2L, second.getSeq());
        assertEquals(first.getCurrentHash(), second.getPrevHash());
        assertNotEquals(first.getCurrentHash(), second.getCurrentHash());
    }

    @Test
    void rbacCacheInvalidationAppliesRemoteVersionUpdate() {
        RbacCacheInvalidationService cacheService = new RbacCacheInvalidationService(null);
        assertTrue(cacheService.isTokenVersionValid("u-1", 1L));

        cacheService.applyRemoteInvalidation("u-1", 2L);
        assertFalse(cacheService.isTokenVersionValid("u-1", 1L));
        assertTrue(cacheService.isTokenVersionValid("u-1", 2L));
    }

    @Test
    void executiveAppointmentValidatorEnforcesTrackSeparationQuotasAndCrossTrackPresidentRule() {
        ExecutiveAppointmentValidator validator = new ExecutiveAppointmentValidator();
        Instant now = Instant.now();

        User youthUnionSecretary = userWithScopes("u-bt", "Bí thư Đoàn", List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.YOUTH_UNION_SECRETARY,
                        "BCH_DOAN", "UNIT", "BCH_DOAN", "2026-2027", now.minusSeconds(60), null, null)
        ));
        User assocVicePresident = userWithScopes("u-lchp", "LCH Phó", List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.ASSOCIATION_VICE_PRESIDENT,
                        "BCH_HOI", "UNIT", "BCH_HOI", "2026-2027", now.minusSeconds(60), null, null)
        ));
        User dualPresident = userWithScopes("u-lcht", "LCH Trưởng kiêm PBT Đoàn", List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.YOUTH_UNION_DEPUTY_SECRETARY,
                        "BCH_DOAN", "UNIT", "BCH_DOAN", "2026-2027", now.minusSeconds(60), null, null),
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.ASSOCIATION_PRESIDENT,
                        "BCH_HOI", "UNIT", "BCH_HOI", "2026-2027", now.minusSeconds(60), null, null)
        ));

        // 1. Track separation for personnel appointments; shared committees allowed for both
        assertDoesNotThrow(() -> validator.assertCanManageExecutiveUnit(youthUnionSecretary, "BCH_DOAN", now));
        assertThrows(BusinessException.class, () -> validator.assertCanManageExecutiveUnit(youthUnionSecretary, "BCH_HOI", now));
        assertDoesNotThrow(() -> validator.assertCanManageExecutiveUnit(assocVicePresident, "BCH_HOI", now));
        assertThrows(BusinessException.class, () -> validator.assertCanManageExecutiveUnit(assocVicePresident, "BCH_DOAN", now));
        assertDoesNotThrow(() -> validator.assertCanManageExecutiveUnit(youthUnionSecretary, "EMFIT", now));
        assertDoesNotThrow(() -> validator.assertCanManageExecutiveUnit(assocVicePresident, "EMFIT", now));
        assertDoesNotThrow(() -> validator.assertCanManageExecutiveUnit(dualPresident, "BCH_DOAN", now));
        assertDoesNotThrow(() -> validator.assertCanManageExecutiveUnit(dualPresident, "BCH_HOI", now));

        // 2. Valid roster with LCH President concurrently Youth Union Deputy Secretary
        assertDoesNotThrow(() -> validator.validateExecutiveRosterAndRules(
                List.of(youthUnionSecretary, assocVicePresident, dualPresident), List.of(), now));

        // 3. Invalid: Association President without Youth Union Deputy Secretary
        User invalidPresident = userWithScopes("u-bad", "LCH Trưởng không kiêm PBT", List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.ASSOCIATION_PRESIDENT,
                        "BCH_HOI", "UNIT", "BCH_HOI", "2026-2027", now.minusSeconds(60), null, null)
        ));
        assertThrows(BusinessException.class, () -> validator.validateExecutiveRosterAndRules(
                List.of(invalidPresident), List.of(), now));

        // 4. Invalid: Exceeding quota (2 Youth Union Secretaries, max is 1)
        User secondSecretary = userWithScopes("u-bt2", "Bí thư 2", List.of(
                new User.RoleScope(RoleCode.STANDING_COMMITTEE, ExecutivePositionTitle.YOUTH_UNION_SECRETARY,
                        "BCH_DOAN", "UNIT", "BCH_DOAN", "2026-2027", now.minusSeconds(60), null, null)
        ));
        assertThrows(BusinessException.class, () -> validator.validateExecutiveRosterAndRules(
                List.of(youthUnionSecretary, secondSecretary), List.of(), now));
    }

    private User userWithScopes(String id, String fullName, List<User.RoleScope> scopes) {
        User u = new User();
        u.setId(id);
        u.setFullName(fullName);
        u.setRoleScopes(scopes);
        return u;
    }
}
