package vn.edu.fit.yitzone.common.security;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Custom Spring Security PermissionEvaluator implementing Scoped Dynamic RBAC (LLD Section 2.3).
 */
@Component
public class ScopedPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated() || permission == null) {
            return false;
        }
        if (hasStandingCommitteeBypass(authentication)) {
            return true;
        }
        String requiredPermission = resolveRequiredPermission(targetDomainObject, permission);
        if (targetDomainObject instanceof ScopedTarget target) {
            return evaluateScopedTarget(authentication, target, requiredPermission);
        }
        List<EffectiveGrant> runtimeGrants = ScopeContextHolder.getEffectiveGrants();
        if (!runtimeGrants.isEmpty()) {
            return evaluateGrants(runtimeGrants, requiredPermission, null, Collections.emptyList(), false, Instant.now());
        }
        return hasAtomicPermission(authentication, requiredPermission);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated() || permission == null) {
            return false;
        }
        if (hasStandingCommitteeBypass(authentication)) {
            return true;
        }
        String requiredPermission = resolveRequiredPermission(targetType, permission);
        List<EffectiveGrant> runtimeGrants = ScopeContextHolder.getEffectiveGrants();
        if (!runtimeGrants.isEmpty()) {
            String targetUnitId = targetId == null ? null : targetId.toString();
            return evaluateGrants(runtimeGrants, requiredPermission, targetUnitId, Collections.emptyList(), false, Instant.now());
        }
        return hasAtomicPermission(authentication, requiredPermission);
    }

    private String resolveRequiredPermission(Object targetDomainOrType, Object permission) {
        String permStr = permission.toString();
        if (permStr.contains(":")) {
            return permStr;
        }
        if (targetDomainOrType instanceof String domain && !domain.isBlank()) {
            return domain + ":" + permStr;
        }
        return permStr;
    }

    public boolean evaluateGrants(
            Collection<EffectiveGrant> grants,
            String requiredPermission,
            String targetUnitId,
            List<String> targetAncestors,
            boolean isInternalCtvEventWithoutBenefits,
            Instant now
    ) {
        if (grants == null || grants.isEmpty()) {
            return false;
        }
        String activeScopeId = ScopeContextHolder.getActiveScopeId();
        boolean isInternalEventPerm = requiredPermission.startsWith("internal_event:");

        for (EffectiveGrant grant : grants) {
            if (!grant.isActiveAt(now)) {
                continue;
            }
            if (!grant.permission().equals(requiredPermission)) {
                continue;
            }
            if (activeScopeId != null && !activeScopeId.equals(grant.scopeId()) && !"FACULTY".equals(grant.scopeType())) {
                continue;
            }
            if (isInternalEventPerm && !isInternalCtvEventWithoutBenefits) {
                return false;
            }
            if (targetUnitId == null || grant.matchesScope(targetUnitId, targetAncestors)) {
                return true;
            }
        }
        return false;
    }

    private boolean evaluateScopedTarget(Authentication authentication, ScopedTarget target, String requiredPermission) {
        boolean isInternalEventPerm = requiredPermission.startsWith("internal_event:");
        if (isInternalEventPerm && !target.internalCtvWithoutBenefits()) {
            return false;
        }
        List<EffectiveGrant> runtimeGrants = ScopeContextHolder.getEffectiveGrants();
        if (!runtimeGrants.isEmpty()) {
            return evaluateGrants(
                    runtimeGrants,
                    requiredPermission,
                    target.unitId(),
                    target.ancestors(),
                    target.internalCtvWithoutBenefits(),
                    Instant.now()
            );
        }
        String activeScopeId = ScopeContextHolder.getActiveScopeId();
        if (target.unitId() != null && activeScopeId != null && !"FACULTY".equals(activeScopeId)) {
            boolean matchesUnit = activeScopeId.equals(target.unitId())
                    || (target.ancestors() != null && target.ancestors().contains(activeScopeId));
            if (!matchesUnit) {
                return false;
            }
        }
        return hasAtomicPermission(authentication, requiredPermission);
    }

    private boolean hasStandingCommitteeBypass(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STANDING_COMMITTEE".equals(a.getAuthority()));
    }

    private boolean hasAtomicPermission(Authentication authentication, String requiredPermission) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(requiredPermission));
    }

    public record ScopedTarget(
            String unitId,
            List<String> ancestors,
            boolean internalCtvWithoutBenefits
    ) {
        public ScopedTarget {
            ancestors = ancestors == null ? Collections.emptyList() : ancestors;
        }
    }
}
