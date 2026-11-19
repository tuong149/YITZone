import { create } from "zustand";

export interface RoleScopeItem {
  roleCode: string;
  unitId: string;
  scopeType: "TEAM" | "COMMITTEE" | "EVENT" | "CAMPAIGN" | "FACULTY";
  scopeId: string;
  label: string;
}

interface AuthState {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  accessToken: string | null;
  activeScopeId: string;
  roleScopes: RoleScopeItem[];
  authorities: string[];
  setSession: (payload: {
    userId: string;
    email: string;
    fullName: string;
    accessToken: string;
    authorities: string[];
    roleScopes?: RoleScopeItem[];
  }) => void;
  setActiveScopeId: (scopeId: string) => void;
  clearSession: () => void;
  hasAuthority: (authority: string) => boolean;
}

const SESSION_STORAGE_KEY = "yitzone_auth_session_v1";

function clearAuthenticatedApiCaches(): void {
  if (typeof window !== "undefined" && "caches" in window) {
    void window.caches.delete("yitzone-events-cache");
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  fullName: null,
  accessToken: null,
  activeScopeId: "FACULTY",
  roleScopes: [],
  authorities: [],
  setSession: ({ userId, email, fullName, accessToken, authorities, roleScopes = [] }) => {
    const activeScopeId = roleScopes[0]?.scopeId ?? "FACULTY";
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ userId, email, fullName, accessToken, authorities, roleScopes, activeScopeId })
      );
    }
    set({
      userId,
      email,
      fullName,
      accessToken,
      authorities,
      roleScopes,
      activeScopeId
    });
  },
  setActiveScopeId: (activeScopeId) => {
    clearAuthenticatedApiCaches();
    set({ activeScopeId });
  },
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    clearAuthenticatedApiCaches();
    set({
      userId: null,
      email: null,
      fullName: null,
      accessToken: null,
      activeScopeId: "FACULTY",
      roleScopes: [],
      authorities: []
    });
  },
  hasAuthority: (authority) => {
    const { authorities } = get();
    return authorities.includes("ROLE_STANDING_COMMITTEE") || authorities.includes(authority);
  }
}));

// Hydrate session from sessionStorage if available on page reload (F5)
if (typeof window !== "undefined") {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        userId: string;
        email: string;
        fullName: string;
        accessToken: string;
        authorities: string[];
        roleScopes?: RoleScopeItem[];
        activeScopeId?: string;
      };
      if (parsed.accessToken && parsed.userId) {
        useAuthStore.setState({
          userId: parsed.userId,
          email: parsed.email,
          fullName: parsed.fullName,
          accessToken: parsed.accessToken,
          authorities: parsed.authorities ?? [],
          roleScopes: parsed.roleScopes ?? [],
          activeScopeId: parsed.activeScopeId ?? "FACULTY"
        });
      }
    }
  } catch {
    // Ignore corrupted session storage
  }
}
