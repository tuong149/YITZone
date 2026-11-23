import { create } from "zustand";
import { clearSensitiveOfflineVault } from "@/lib/offline-db";
import { hasAnyPermission } from "@/lib/permissions";
import { queryClient } from "@/lib/query-client";
import { useCartStore } from "@/stores/cart-store";

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
  syncFromMe: (payload: { activeScopeId?: string; authorities?: string[] }) => void;
  setActiveScopeId: (scopeId: string) => void;
  clearSession: () => void;
  hasAuthority: (authority: string) => boolean;
}

const SESSION_STORAGE_KEY = "yitzone_auth_session_v1";
const USER_DRAFT_STORAGE_KEYS = [
  "yitzone-event-wizard-draft-v2",
  "yitzone_cms_compose_draft_v1"
];

function clearAuthenticatedApiCaches(): void {
  queryClient.clear();
  if (typeof window !== "undefined" && "caches" in window) {
    void window.caches.delete("yitzone-events-cache");
  }
}

function clearUserLocalDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of USER_DRAFT_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("yitzone-exam-draft:")) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // Ignore storage cleanup errors
  }
}

function isJwtExpired(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp === "number") {
      return payload.exp * 1000 <= Date.now();
    }
  } catch {
    return false;
  }
  return false;
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
  syncFromMe: ({ activeScopeId, authorities }) => {
    const current = get();
    const nextScope = activeScopeId ?? current.activeScopeId;
    const nextAuthorities = authorities ?? current.authorities;
    if (typeof window !== "undefined" && current.accessToken && current.userId) {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          userId: current.userId,
          email: current.email,
          fullName: current.fullName,
          accessToken: current.accessToken,
          authorities: nextAuthorities,
          roleScopes: current.roleScopes,
          activeScopeId: nextScope
        })
      );
    }
    set({ activeScopeId: nextScope, authorities: nextAuthorities });
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
    clearUserLocalDrafts();
    useCartStore.getState().clearAll();
    void clearSensitiveOfflineVault();
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
  hasAuthority: (authority) => hasAnyPermission(get().authorities, [authority])
}));

// Hydrate session from sessionStorage if available and not expired on page reload (F5)
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
        const demoBlocked =
          parsed.accessToken === "demo-local-offline-token" &&
          import.meta.env.VITE_DEMO_MODE !== "true";
        if (demoBlocked || isJwtExpired(parsed.accessToken)) {
          window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
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
    }
  } catch {
    // Ignore corrupted session storage
  }
}
