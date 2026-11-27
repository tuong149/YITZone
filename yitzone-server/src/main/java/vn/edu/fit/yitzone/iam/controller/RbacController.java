package vn.edu.fit.yitzone.iam.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionCatalog;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.service.ExecutivePositionCatalogService;
import vn.edu.fit.yitzone.iam.service.OrgUnitService;
import vn.edu.fit.yitzone.iam.service.PermissionModuleService;
import vn.edu.fit.yitzone.iam.service.RbacGrantService;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rbac")
public class RbacController {
    private final OrgUnitService orgUnitService;
    private final PermissionModuleService permissionModuleService;
    private final RbacGrantService rbacGrantService;
    private final ExecutivePositionCatalogService positionCatalogService;

    public RbacController(
            OrgUnitService orgUnitService,
            PermissionModuleService permissionModuleService,
            RbacGrantService rbacGrantService,
            @Autowired(required = false) ExecutivePositionCatalogService positionCatalogService
    ) {
        this.orgUnitService = orgUnitService;
        this.permissionModuleService = permissionModuleService;
        this.rbacGrantService = rbacGrantService;
        this.positionCatalogService = positionCatalogService;
    }

    @GetMapping("/org-units")
    public ApiResponse<List<OrgUnit>> listOrgUnits() {
        return ApiResponse.ok(orgUnitService.listAll());
    }

    @PostMapping("/org-units")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage')")
    public ApiResponse<OrgUnit> createOrgUnit(@Valid @RequestBody CreateOrgUnitRequest req) {
        return ApiResponse.ok(orgUnitService.createUnit(
                req.code(),
                req.name(),
                req.unitType(),
                req.parentId(),
                req.defaultDeptModules(),
                req.termYear()
        ));
    }

    @PutMapping("/org-units/{id}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage')")
    public ApiResponse<OrgUnit> updateOrgUnit(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrgUnitRequest req
    ) {
        return ApiResponse.ok(orgUnitService.updateUnit(
                id,
                req.name(),
                req.parentId(),
                req.defaultDeptModules(),
                req.active()
        ));
    }

    @GetMapping("/modules")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage') or hasPermission('rbac', 'grant_delegable')")
    public ApiResponse<List<PermissionModule>> listPermissionModules() {
        return ApiResponse.ok(permissionModuleService.listAll());
    }

    @PostMapping("/modules")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<PermissionModule> createOrUpdateModule(@Valid @RequestBody SavePermissionModuleRequest req) {
        PermissionModule module = new PermissionModule();
        module.setModuleCode(req.moduleCode().trim().toUpperCase());
        module.setName(req.name().trim());
        module.setDescription(req.description());
        module.setIncludedPermissions(req.includedPermissions() == null ? List.of() : List.copyOf(req.includedPermissions()));
        module.setNonDelegable(req.nonDelegable());
        return ApiResponse.ok(permissionModuleService.saveModule(module));
    }

    @PutMapping("/modules/{moduleCode}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<PermissionModule> updateModule(
            @PathVariable String moduleCode,
            @Valid @RequestBody SavePermissionModuleRequest req
    ) {
        PermissionModule module = permissionModuleService.listAll().stream()
                .filter(m -> moduleCode.equalsIgnoreCase(m.getModuleCode()))
                .findFirst()
                .orElseGet(PermissionModule::new);
        module.setModuleCode(moduleCode.trim().toUpperCase());
        module.setName(req.name().trim());
        module.setDescription(req.description());
        if (req.includedPermissions() != null) {
            module.setIncludedPermissions(List.copyOf(req.includedPermissions()));
        }
        module.setNonDelegable(req.nonDelegable());
        return ApiResponse.ok(permissionModuleService.saveModule(module));
    }

    @GetMapping("/position-titles")
    public ApiResponse<List<ExecutivePositionCatalog>> listPositionTitles(
            @RequestParam(defaultValue = "false") boolean includeInactive
    ) {
        if (positionCatalogService == null) {
            return ApiResponse.ok(List.of());
        }
        return ApiResponse.ok(positionCatalogService.listAll(includeInactive));
    }

    @PostMapping("/position-titles")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<ExecutivePositionCatalog> createPositionTitle(
            @Valid @RequestBody CreatePositionTitleRequest req,
            Authentication auth
    ) {
        return ApiResponse.ok(positionCatalogService.createTitle(
                req.code(),
                req.displayName(),
                req.orgUnitCode(),
                req.mappedRoleCode(),
                req.maxQuota() == null ? 1 : req.maxQuota(),
                auth.getName()
        ));
    }

    @PutMapping("/position-titles/{code}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<ExecutivePositionCatalog> updatePositionTitle(
            @PathVariable String code,
            @RequestBody UpdatePositionTitleRequest req,
            Authentication auth
    ) {
        return ApiResponse.ok(positionCatalogService.updateTitle(
                code,
                req.displayName(),
                req.orgUnitCode(),
                req.mappedRoleCode(),
                req.maxQuota(),
                req.active(),
                auth.getName()
        ));
    }

    @GetMapping("/grants")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage') or hasPermission('rbac', 'grant_delegable')")
    public ApiResponse<List<RbacGrantService.GrantView>> listGrants() {
        return ApiResponse.ok(rbacGrantService.listActiveGrants());
    }

    @PostMapping("/grants")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage') or hasPermission('rbac', 'grant_delegable')")
    public ApiResponse<RbacGrantService.GrantView> createGrant(
            @Valid @RequestBody CreateGrantRequest req,
            Authentication auth
    ) {
        return ApiResponse.ok(rbacGrantService.grantModule(
                new RbacGrantService.GrantRequest(
                        req.targetIdentifier(),
                        req.moduleCode(),
                        req.scopeType(),
                        req.scopeId(),
                        req.expiresAt(),
                        req.reason()
                ),
                auth
        ));
    }

    @DeleteMapping("/grants/{userId}/{moduleCode}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage') or hasPermission('rbac', 'grant_delegable')")
    public ApiResponse<RevokeGrantResponse> revokeGrant(
            @PathVariable String userId,
            @PathVariable String moduleCode,
            @RequestParam(required = false) String scopeId,
            @RequestParam(required = false) String reason,
            Authentication auth
    ) {
        rbacGrantService.revokeModule(userId, moduleCode, scopeId, reason, auth);
        return ApiResponse.ok(new RevokeGrantResponse(userId, moduleCode, scopeId, "REVOKED"));
    }

    public record CreateOrgUnitRequest(
            @NotBlank String code,
            @NotBlank String name,
            OrgUnit.UnitType unitType,
            String parentId,
            List<String> defaultDeptModules,
            String termYear
    ) {
    }

    public record UpdateOrgUnitRequest(
            String name,
            String parentId,
            List<String> defaultDeptModules,
            Boolean active
    ) {
    }

    public record CreateGrantRequest(
            @NotBlank String targetIdentifier,
            @NotBlank String moduleCode,
            String scopeType,
            @NotBlank String scopeId,
            Instant expiresAt,
            String reason
    ) {
    }

    public record RevokeGrantResponse(
            String userId,
            String moduleCode,
            String scopeId,
            String status
    ) {
    }

    public record SavePermissionModuleRequest(
            @NotBlank String moduleCode,
            @NotBlank String name,
            String description,
            List<String> includedPermissions,
            boolean nonDelegable
    ) {
    }

    public record CreatePositionTitleRequest(
            @NotBlank String code,
            @NotBlank String displayName,
            @NotBlank String orgUnitCode,
            RoleCode mappedRoleCode,
            Integer maxQuota
    ) {
    }

    public record UpdatePositionTitleRequest(
            String displayName,
            String orgUnitCode,
            RoleCode mappedRoleCode,
            Integer maxQuota,
            Boolean active
    ) {
    }
}
