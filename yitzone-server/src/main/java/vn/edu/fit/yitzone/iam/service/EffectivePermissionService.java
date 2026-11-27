package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.security.EffectiveGrant;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.Role;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.RoleRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Computes Union RBAC permissions & scoped EffectiveGrants across multi-role appointments
 * and TTL-scoped AssignedModules (UC-IAM-09, UC-IAM-10, FR-RBAC-01, LLD 2.3).
 */
@Service
public class EffectivePermissionService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionModuleRepository permissionModuleRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final RbacCacheInvalidationService rbacCacheService;

    private final Map<String, CachedPermissions> localCache = new ConcurrentHashMap<>();

    public EffectivePermissionService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionModuleRepository permissionModuleRepository,
            OrgUnitRepository orgUnitRepository,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionModuleRepository = permissionModuleRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.rbacCacheService = rbacCacheService;
    }

    public ComputedPermissions resolveForUser(User user) {
        Instant now = Instant.now();
        CachedPermissions cached = localCache.get(user.getId());
        if (cached != null
                && cached.permissionVersion() == user.getPermissionVersion()
                && cached.expiresAt().isAfter(now)) {
            return cached.permissions();
        }

        ComputedPermissions computed = computeUnion(user, now);
        localCache.put(user.getId(), new CachedPermissions(user.getPermissionVersion(), computed, now.plusSeconds(300)));
        if (rbacCacheService != null) {
            rbacCacheService.registerLocalUserScopes(user.getId(), computed.allowedScopes());
        }
        return computed;
    }

    public Optional<ComputedPermissions> resolveForUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findById(userId).map(this::resolveForUser);
    }

    public void evictLocalCache(String userId) {
        if (userId != null) {
            localCache.remove(userId);
        }
    }

    public ComputedPermissions computeUnion(User user, Instant now) {
        Map<RoleCode, Role> rolesByCode = new HashMap<>();
        for (Role r : roleRepository.findAll()) {
            rolesByCode.put(r.getCode(), r);
        }

        Map<String, PermissionModule> modulesByCode = new HashMap<>();
        for (PermissionModule m : permissionModuleRepository.findAll()) {
            modulesByCode.put(m.getModuleCode(), m);
        }

        Map<String, OrgUnit> unitsById = new HashMap<>();
        for (OrgUnit unit : orgUnitRepository.findAll()) {
            if (unit.getId() != null) {
                unitsById.put(unit.getId(), unit);
            }
            if (unit.getCode() != null) {
                unitsById.put(unit.getCode(), unit);
            }
        }

        Set<String> authorities = new LinkedHashSet<>();
        Set<String> allowedScopes = new LinkedHashSet<>();
        allowedScopes.add("FACULTY");
        List<EffectiveGrant> grants = new ArrayList<>();
        List<RoleScopeView> activeRoleScopes = new ArrayList<>();
        boolean privilegedAdmin = false;

        // Baseline student authorities for all authenticated accounts
        authorities.add("event:view");
        authorities.add("attendance:check_in");
        authorities.add("store:view");
        authorities.add("voting:cast");

        if (user.getRoleScopes() != null) {
            for (User.RoleScope rs : user.getRoleScopes()) {
                if (rs == null || !rs.isActiveAt(now)) {
                    continue;
                }
                String scopeId = rs.scopeId() != null && !rs.scopeId().isBlank() ? rs.scopeId() : "FACULTY";
                String scopeType = rs.scopeType() != null && !rs.scopeType().isBlank() ? rs.scopeType() : "FACULTY";
                allowedScopes.add(scopeId);

                OrgUnit unit = rs.unitId() != null ? unitsById.get(rs.unitId()) : unitsById.get(scopeId);
                String unitLabel = unit != null ? unit.getName() : scopeId;
                activeRoleScopes.add(new RoleScopeView(
                        rs.roleCode() != null ? rs.roleCode().name() : null,
                        rs.unitId(),
                        scopeType,
                        scopeId,
                        unitLabel
                ));

                if (rs.roleCode() != null) {
                    authorities.add("ROLE_" + rs.roleCode().name());
                    if (rs.roleCode() == RoleCode.STANDING_COMMITTEE
                            || rs.roleCode() == RoleCode.EXECUTIVE_COMMITTEE
                            || rs.roleCode() == RoleCode.SYSTEM_ADMIN) {
                        privilegedAdmin = true;
                    }

                    Set<String> collectedModuleCodes = new LinkedHashSet<>();
                    Set<String> collectedPermissions = new LinkedHashSet<>();
                    collectInheritedRolePermissions(rs.roleCode(), rolesByCode, collectedModuleCodes, collectedPermissions, new HashSet<>());

                    if (unit != null && unit.getDefaultDeptModules() != null) {
                        collectedModuleCodes.addAll(unit.getDefaultDeptModules());
                    }

                    // Enforce invariant: SystemAdmin never receives MOD_LIVEQA_UNMASK
                    if (rs.roleCode() == RoleCode.SYSTEM_ADMIN) {
                        collectedModuleCodes.remove("MOD_LIVEQA_UNMASK");
                        collectedPermissions.remove("liveqa:unmask");
                    }

                    for (String modCode : collectedModuleCodes) {
                        authorities.add(modCode);
                        PermissionModule mod = modulesByCode.get(modCode);
                        if (mod != null && mod.getIncludedPermissions() != null) {
                            collectedPermissions.addAll(mod.getIncludedPermissions());
                        }
                    }

                    for (String perm : collectedPermissions) {
                        authorities.add(perm);
                        grants.add(new EffectiveGrant(perm, scopeType, scopeId, rs.expiresAt()));
                    }
                }
            }
        }

        if (user.getAssignedModules() != null) {
            for (User.AssignedModule am : user.getAssignedModules()) {
                if (am == null || am.moduleCode() == null) {
                    continue;
                }
                if (am.expiresAt() != null && !now.isBefore(am.expiresAt())) {
                    continue;
                }
                String scopeId = am.scopeId() != null && !am.scopeId().isBlank() ? am.scopeId() : "FACULTY";
                String scopeType = am.scopeType() != null && !am.scopeType().isBlank() ? am.scopeType() : "FACULTY";
                PermissionModule mod = modulesByCode.get(am.moduleCode());
                if (mod != null && mod.isActive() && mod.getIncludedPermissions() != null) {
                    allowedScopes.add(scopeId);
                    authorities.add(am.moduleCode());
                    for (String perm : mod.getIncludedPermissions()) {
                        authorities.add(perm);
                        grants.add(new EffectiveGrant(perm, scopeType, scopeId, am.expiresAt()));
                    }
                }
            }
        }

        return new ComputedPermissions(
                List.copyOf(authorities),
                Set.copyOf(allowedScopes),
                List.copyOf(grants),
                List.copyOf(activeRoleScopes),
                privilegedAdmin,
                user.getLifecycleStatus() == User.LifecycleStatus.ARCHIVED
        );
    }

    private void collectInheritedRolePermissions(
            RoleCode code,
            Map<RoleCode, Role> rolesByCode,
            Set<String> moduleCodes,
            Set<String> permissions,
            Set<RoleCode> visited
    ) {
        if (code == null || !visited.add(code)) {
            return;
        }
        Role role = rolesByCode.get(code);
        if (role == null) {
            return;
        }
        if (role.getModuleCodes() != null) {
            moduleCodes.addAll(role.getModuleCodes());
        }
        if (role.getPermissions() != null) {
            permissions.addAll(role.getPermissions());
        }
        if (role.getParentRoleCode() != null) {
            collectInheritedRolePermissions(role.getParentRoleCode(), rolesByCode, moduleCodes, permissions, visited);
        }
    }

    private record CachedPermissions(
            long permissionVersion,
            ComputedPermissions permissions,
            Instant expiresAt
    ) {
    }

    public record RoleScopeView(
            String roleCode,
            String unitId,
            String scopeType,
            String scopeId,
            String label
    ) {
    }

    public record ComputedPermissions(
            List<String> authorities,
            Set<String> allowedScopes,
            List<EffectiveGrant> grants,
            List<RoleScopeView> roleScopes,
            boolean privilegedAdmin,
            boolean accountArchived
    ) {
        public ComputedPermissions(
                List<String> authorities,
                Set<String> allowedScopes,
                List<EffectiveGrant> grants,
                List<RoleScopeView> roleScopes,
                boolean privilegedAdmin
        ) {
            this(authorities, allowedScopes, grants, roleScopes, privilegedAdmin, false);
        }
    }
}
