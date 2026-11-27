package vn.edu.fit.yitzone.iam;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.AtomicPermissionCatalog;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.IamBootstrapSeeder;
import vn.edu.fit.yitzone.iam.service.PermissionModuleService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class PermissionModuleServiceTest {

    @Test
    void all20StandardModulesOnlyReferenceKnownAtomicPermissionsAndPassInvariants() {
        IamBootstrapSeeder seeder = new IamBootstrapSeeder(null, null, null);
        PermissionModuleService service = new PermissionModuleService(Mockito.mock(PermissionModuleRepository.class));

        List<PermissionModule> standard = seeder.buildStandardPermissionModules();
        assertThat(standard).hasSize(20);
        for (PermissionModule mod : standard) {
            service.validateInvariants(mod, null);
            assertThat(mod.getIncludedPermissions())
                    .isNotEmpty()
                    .allSatisfy(p -> assertThat(AtomicPermissionCatalog.isKnown(p))
                            .as("Permission %s in %s must exist in AtomicPermissionCatalog", p, mod.getModuleCode())
                            .isTrue());
        }
    }

    @Test
    void createsUpdatesAndDisablesCustomModuleWithSecurityInvariantsAndCacheInvalidation() {
        Map<String, PermissionModule> store = new HashMap<>();
        PermissionModuleRepository modRepo = Mockito.mock(PermissionModuleRepository.class);
        when(modRepo.findByModuleCode(anyString())).thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0))));
        when(modRepo.findAll()).thenAnswer(inv -> new ArrayList<>(store.values()));
        when(modRepo.save(any(PermissionModule.class))).thenAnswer(inv -> {
            PermissionModule m = inv.getArgument(0);
            store.put(m.getModuleCode(), m);
            return m;
        });

        // Seed 1 system default module
        PermissionModule sysDefault = new PermissionModule();
        sysDefault.setModuleCode("MOD_EVENT_OPS");
        sysDefault.setName("Tổ chức sự kiện");
        sysDefault.setIncludedPermissions(List.of("event:create", "event:update"));
        sysDefault.setSystemDefault(true);
        sysDefault.setActive(true);
        store.put(sysDefault.getModuleCode(), sysDefault);

        User holder = new User();
        holder.setId("u-holder-1");
        holder.setPermissionVersion(1L);
        holder.setAssignedModules(List.of(new User.AssignedModule("MOD_CLUB_MEDIA", "COMMITTEE", "EMFIT", null)));

        UserRepository userRepo = Mockito.mock(UserRepository.class);
        when(userRepo.findAll()).thenReturn(List.of(holder));
        when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        RbacCacheInvalidationService cacheService = new RbacCacheInvalidationService(null);
        AuditLogService auditService = new AuditLogService(null, null);
        PermissionModuleService service = new PermissionModuleService(modRepo, userRepo, null, cacheService, auditService);

        var btvAuth = new UsernamePasswordAuthenticationToken(
                "u-btv", null, List.of(new SimpleGrantedAuthority("ROLE_STANDING_COMMITTEE"))
        );
        var sysAdminAuth = new UsernamePasswordAuthenticationToken(
                "u-sysadmin", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))
        );

        // 1. Create valid custom module
        PermissionModule created = service.createModule(
                new PermissionModuleService.CreateModuleCommand(
                        "mod_club_media",
                        "Truyền thông CLB Học thuật",
                        "Chỉ soạn thảo và chỉnh sửa bài viết bản tin cho CLB",
                        List.of("cms:create", "cms:edit"),
                        false,
                        "Tạo gói truyền thông riêng cho CLB"
                ),
                btvAuth
        );
        assertThat(created.getModuleCode()).isEqualTo("MOD_CLUB_MEDIA");
        assertThat(created.isSystemDefault()).isFalse();
        assertThat(created.isActive()).isTrue();
        assertThat(created.getIncludedPermissions()).containsExactly("cms:create", "cms:edit");

        // 2. Duplicate code -> 409 CONFLICT
        assertThatThrownBy(() -> service.createModule(
                new PermissionModuleService.CreateModuleCommand(
                        "MOD_CLUB_MEDIA", "Trùng", "", List.of("cms:create"), false, null
                ),
                btvAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

        // 3. Unknown atomic permission -> 400 BAD_REQUEST
        assertThatThrownBy(() -> service.createModule(
                new PermissionModuleService.CreateModuleCommand(
                        "MOD_BAD_PERM", "Sai quyền", "", List.of("nonexistent:perm"), false, null
                ),
                btvAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        // 4. Sensitive permission with nonDelegable=false -> 400 BAD_REQUEST
        assertThatThrownBy(() -> service.createModule(
                new PermissionModuleService.CreateModuleCommand(
                        "MOD_LEAK_AUDIT", "Rò rỉ audit", "", List.of("audit:view"), false, null
                ),
                btvAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        // 5. SystemAdmin trying to create module with liveqa:unmask -> 403 FORBIDDEN
        assertThatThrownBy(() -> service.createModule(
                new PermissionModuleService.CreateModuleCommand(
                        "MOD_SYSADMIN_UNMASK", "Lách luật", "", List.of("liveqa:unmask"), true, null
                ),
                sysAdminAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        // 6. System default module cannot be deactivated or have core permissions altered
        assertThatThrownBy(() -> service.updateModule(
                "MOD_EVENT_OPS",
                new PermissionModuleService.UpdateModuleCommand(null, null, null, null, false, "Thử tắt"),
                btvAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> service.updateModule(
                "MOD_EVENT_OPS",
                new PermissionModuleService.UpdateModuleCommand(null, null, List.of("event:create"), null, null, "Thử rút quyền"),
                btvAuth
        )).isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        // 7. Disabling custom module bumps holder permissionVersion and invalidates token cache
        PermissionModule disabled = service.updateModule(
                "MOD_CLUB_MEDIA",
                new PermissionModuleService.UpdateModuleCommand(null, null, null, null, false, "Ngưng dùng sau học kỳ"),
                btvAuth
        );
        assertThat(disabled.isActive()).isFalse();
        assertThat(holder.getPermissionVersion()).isEqualTo(2L);
        assertThat(cacheService.isTokenVersionValid("u-holder-1", 1L)).isFalse();
        assertThat(cacheService.isTokenVersionValid("u-holder-1", 2L)).isTrue();
    }
}
