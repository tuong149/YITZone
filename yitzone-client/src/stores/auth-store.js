import { create } from "zustand";
import { clearSensitiveOfflineVault } from "@/lib/offline-db";
import { hasAnyPermission } from "@/lib/permissions";
import { queryClient } from "@/lib/query-client";
import { useCartStore } from "@/stores/cart-store";

/**
 * @typedef {Object} RoleScopeItem
 * @property {string} roleCode
 * @property {string} unitId
 * @property {"TEAM" | "COMMITTEE" | "EVENT" | "CAMPAIGN" | "FACULTY"} scopeType
 * @property {string} scopeId
 * @property {string} label
 */

const SESSION_STORAGE_KEY = "yitzone_auth_session_v1";
export const AUTH_REDIRECT_STORAGE_KEY = "yitzone_auth_redirect_v1";
const USER_DRAFT_STORAGE_KEYS = [
  "yitzone-event-wizard-draft-v2",
  "yitzone_cms_compose_draft_v1"
];

export function hasUserLocalDrafts() {
  if (typeof window === "undefined") return false;
  try {
    for (const key of USER_DRAFT_STORAGE_KEYS) {
      if (window.localStorage.getItem(key)) return true;
    }
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("yitzone-exam-draft:") || k.startsWith("yitzone-survey-draft:"))) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function clearAuthenticatedApiCaches() {
  queryClient.clear();
  if (typeof window !== "undefined" && "caches" in window) {
    void window.caches.delete("yitzone-events-cache");
  }
}

function clearUserLocalDrafts(userId) {
  if (typeof window === "undefined") return;
  try {
    for (const key of USER_DRAFT_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    if (userId) {
      window.localStorage.removeItem(`yitzone-event-registrations-v1:${userId}`);
    }
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith("yitzone-exam-draft:") || k.startsWith("yitzone-survey-draft:"))) {
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

function isJwtExpired(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp === "number") {
      return payload.exp * 1000 <= Date.now();
    }
  } catch {
    return false;
  }
  return false;
}

export const useAuthStore = create((set, get) => ({
  userId: null,
  email: null,
  fullName: null,
  accessToken: null,
  authProvider: "password",
  activeScopeId: "FACULTY",
  roleScopes: [],
  authorities: [],
  setSession: ({ userId, email, fullName, accessToken, authorities, roleScopes = [], authProvider = "password" }) => {
    const activeScopeId = roleScopes[0]?.scopeId ?? "FACULTY";
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ userId, email, fullName, accessToken, authorities, roleScopes, activeScopeId, authProvider })
      );
    }
    set({
      userId,
      email,
      fullName,
      accessToken,
      authProvider,
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
          authProvider: current.authProvider,
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
  clearSession: (options) => {
    const reason = options?.reason ?? "logout";
    const previousUserId = get().userId;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      if (reason === "logout") {
        window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      }
    }
    clearAuthenticatedApiCaches();
    // Only wipe drafts, cart, and user-scoped local registrations on explicit logout.
    // On 401 session expiry, preserve all in-progress drafts and cart items so users never lose work.
    if (reason === "logout") {
      clearUserLocalDrafts(previousUserId);
      useCartStore.getState().clearAll();
      void clearSensitiveOfflineVault();
    }
    set({
      userId: null,
      email: null,
      fullName: null,
      accessToken: null,
      authProvider: "password",
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
      const parsed = JSON.parse(raw);
      if (parsed.accessToken && parsed.userId) {
        if (isJwtExpired(parsed.accessToken)) {
          window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
          useAuthStore.setState({
            userId: parsed.userId,
            email: parsed.email,
            fullName: parsed.fullName,
            accessToken: parsed.accessToken,
            authProvider: parsed.authProvider ?? "password",
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
