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
        String requiredPermission = permission.toString();
        if (hasStandingCommitteeBypass(authentication)) {
            return true;
        }
        if (targetDomainObject instanceof ScopedTarget target) {
            return evaluateScopedTarget(authentication, target, requiredPermission);
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
        return hasAtomicPermission(authentication, permission.toString());
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
