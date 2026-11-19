package vn.edu.fit.yitzone.common.security;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;

public final class ScopeContextHolder {
    private static final ThreadLocal<String> ACTIVE_SCOPE_ID = new ThreadLocal<>();
    private static final ThreadLocal<Set<String>> ALLOWED_SCOPES = new ThreadLocal<>();
    private static final ThreadLocal<List<EffectiveGrant>> EFFECTIVE_GRANTS = new ThreadLocal<>();

    private ScopeContextHolder() {
    }

    public static void setActiveScopeId(String scopeId) {
        ACTIVE_SCOPE_ID.set(scopeId);
    }

    public static String getActiveScopeId() {
        return ACTIVE_SCOPE_ID.get();
    }

    public static void setAllowedScopes(Set<String> allowedScopes) {
        ALLOWED_SCOPES.set(allowedScopes == null ? Collections.emptySet() : Set.copyOf(allowedScopes));
    }

    public static Set<String> getAllowedScopes() {
        Set<String> scopes = ALLOWED_SCOPES.get();
        return scopes == null ? Collections.emptySet() : scopes;
    }

    public static void setEffectiveGrants(Collection<EffectiveGrant> grants) {
        EFFECTIVE_GRANTS.set(grants == null ? Collections.emptyList() : List.copyOf(grants));
    }

    public static List<EffectiveGrant> getEffectiveGrants() {
        List<EffectiveGrant> grants = EFFECTIVE_GRANTS.get();
        return grants == null ? Collections.emptyList() : grants;
    }

    public static void clear() {
        ACTIVE_SCOPE_ID.remove();
        ALLOWED_SCOPES.remove();
        EFFECTIVE_GRANTS.remove();
    }
}
