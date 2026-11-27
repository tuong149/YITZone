package vn.edu.fit.yitzone.iam;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.RoleRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RbacGrantService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class EffectivePermissionAndRbacGrantTest {

    @Test
    void computesUnionAcrossMultipleRoleScopesAndExcludesExpiredAssignedModules() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        RoleRepository roleRepo = Mockito.mock(RoleRepository.class);
        PermissionModuleRepository modRepo = Mockito.mock(PermissionModuleRepository.class);
        OrgUnitRepository unitRepo = Mockito.mock(OrgUnitRepository.class);

        when(roleRepo.findAll()).thenReturn(seeder.buildStandardRoles());
        when(modRepo.findAll()).thenReturn(seeder.buildStandardPermissionModules());
        when(unitRepo.findAll()).thenReturn(seeder.buildStandardOrgUnits());

        User dualRoleUser = new User();
        dualRoleUser.setId("u-dual");
        dualRoleUser.setEmail("dual@student.hcmute.edu.vn");
        dualRoleUser.setRoleScopes(List.of(
                new User.RoleScope(RoleCode.TEAM_LEADER, null, "EMFIT_TT", "TEAM", "EMFIT_TT", "2026", Instant.now().minusSeconds(60), null, null),
                new User.RoleScope(RoleCode.COLLABORATOR, null, "OFIT", "COMMITTEE", "OFIT", "2026", Instant.now().minusSeconds(60), null, null)
        ));
        dualRoleUser.setAssignedModules(List.of(
                new User.AssignedModule("MOD_ATTENDANCE_STAFF", "EVENT", "EVT-1", Instant.now().plusSeconds(3600)),
                new User.AssignedModule("MOD_STORE_BOOTH", "CAMPAIGN", "CMP-OLD", Instant.now().minusSeconds(60))
        ));

        EffectivePermissionService service = new EffectivePermissionService(userRepo, roleRepo, modRepo, unitRepo, new RbacCacheInvalidationService(null));
        var computed = service.resolveForUser(dualRoleUser);

        assertThat(computed.allowedScopes()).contains("FACULTY", "EMFIT_TT", "OFIT", "EVT-1");
        assertThat(computed.allowedScopes()).doesNotContain("CMP-OLD");
        assertThat(computed.authorities()).contains("MOD_DEPT_EVENT_MEDIA", "MOD_CMS_EDITORIAL", "MOD_DEPT_OFFICE", "MOD_ATTENDANCE_STAFF", "attendance:barcode_scan");
        assertThat(computed.authorities()).doesNotContain("MOD_STORE_BOOTH");
    }

    @Test
    void blocksNonDelegableGrantByNonBtvAndRevokesWithinFiveSecondsViaPermVersion() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);
        UserRepository userRepo = Mockito.mock(UserRepository.class);
        RoleRepository roleRepo = Mockito.mock(RoleRepository.class);
        PermissionModuleRepository modRepo = Mockito.mock(PermissionModuleRepository.class);
        OrgUnitRepository unitRepo = Mockito.mock(OrgUnitRepository.class);

        when(roleRepo.findAll()).thenReturn(seeder.buildStandardRoles());
        when(modRepo.findAll()).thenReturn(seeder.buildStandardPermissionModules());
        when(unitRepo.findAll()).thenReturn(seeder.buildStandardOrgUnits());
        for (var m : seeder.buildStandardPermissionModules()) {
            when(modRepo.findByModuleCode(m.getModuleCode())).thenReturn(Optional.of(m));
        }

        User student = new User();
        student.setId("u-sv-1");
        student.setStudentCode("22110418");
        student.setEmail("22110418@student.hcmute.edu.vn");
        student.setPermissionVersion(1L);
        student.setAssignedModules(new ArrayList<>());

        when(userRepo.findByStudentCode("22110418")).thenReturn(Optional.of(student));
        when(userRepo.findById("u-sv-1")).thenReturn(Optional.of(student));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        RbacCacheInvalidationService cacheService = new RbacCacheInvalidationService(null);
        EffectivePermissionService effectiveService = new EffectivePermissionService(userRepo, roleRepo, modRepo, unitRepo, cacheService);
        AuditLogService auditService = new AuditLogService(null, null);
        RbacGrantService grantService = new RbacGrantService(userRepo, modRepo, cacheService, effectiveService, auditService, null);

        var bchAuth = new UsernamePasswordAuthenticationToken(
                "u-bch", null, List.of(new SimpleGrantedAuthority("ROLE_EXECUTIVE_COMMITTEE"), new SimpleGrantedAuthority("MOD_EVENT_OPS"))
        );

        // Non-BTV trying to grant MOD_YITBOT_FULL -> 403 Forbidden
        assertThatThrownBy(() -> grantService.grantModule(
                new RbacGrantService.GrantRequest("22110418", "MOD_YITBOT_FULL", "FACULTY", "FACULTY", null, "test"),
                bchAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        // BTV grants MOD_ATTENDANCE_STAFF and then revokes it -> permVersion bumps and invalidates old token immediately
        var btvAuth = new UsernamePasswordAuthenticationToken(
                "u-btv", null, List.of(new SimpleGrantedAuthority("ROLE_STANDING_COMMITTEE"))
        );
        var granted = grantService.grantModule(
                new RbacGrantService.GrantRequest("22110418", "MOD_ATTENDANCE_STAFF", "EVENT", "EVT-2026", Instant.now().plusSeconds(3600), "Phân công soát vé"),
                btvAuth
        );
        assertThat(granted.moduleCode()).isEqualTo("MOD_ATTENDANCE_STAFF");
        assertThat(student.getPermissionVersion()).isEqualTo(2L);
        assertThat(cacheService.isTokenVersionValid("u-sv-1", 1L)).isFalse();
        assertThat(cacheService.isTokenVersionValid("u-sv-1", 2L)).isTrue();

        grantService.revokeModule("u-sv-1", "MOD_ATTENDANCE_STAFF", "EVT-2026", "Kết thúc sự kiện", btvAuth);
        assertThat(student.getPermissionVersion()).isEqualTo(3L);
        assertThat(cacheService.isTokenVersionValid("u-sv-1", 2L)).isFalse();
    }
}
