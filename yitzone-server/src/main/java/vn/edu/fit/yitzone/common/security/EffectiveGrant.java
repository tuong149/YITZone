package vn.edu.fit.yitzone.common.security;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record EffectiveGrant(
        String permission,
        String scopeType,
        String scopeId,
        Instant expiresAt
) implements Serializable {

    public boolean isActiveAt(Instant now) {
        return expiresAt == null || expiresAt.isAfter(now);
    }

    public boolean matchesScope(String targetScopeId, List<String> targetAncestors) {
        if ("FACULTY".equalsIgnoreCase(scopeType)) {
            return true;
        }
        if (scopeId == null || targetScopeId == null) {
            return false;
        }
        if (scopeId.equals(targetScopeId)) {
            return true;
        }
        return targetAncestors != null && targetAncestors.contains(scopeId);
    }
}
