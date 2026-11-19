package vn.edu.fit.yitzone.common.security;

public final class ScopeContextHolder {
    private static final ThreadLocal<String> ACTIVE_SCOPE_ID = new ThreadLocal<>();

    private ScopeContextHolder() {
    }

    public static void setActiveScopeId(String scopeId) {
        ACTIVE_SCOPE_ID.set(scopeId);
    }

    public static String getActiveScopeId() {
        return ACTIVE_SCOPE_ID.get();
    }

    public static void clear() {
        ACTIVE_SCOPE_ID.remove();
    }
}
