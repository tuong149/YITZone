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

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  fullName: null,
  accessToken: null,
  activeScopeId: "FACULTY",
  roleScopes: [],
  authorities: [],
  setSession: ({ userId, email, fullName, accessToken, authorities, roleScopes = [] }) =>
    set({
      userId,
      email,
      fullName,
      accessToken,
      authorities,
      roleScopes,
      activeScopeId: roleScopes[0]?.scopeId ?? "FACULTY"
    }),
  setActiveScopeId: (activeScopeId) => set({ activeScopeId }),
  clearSession: () =>
    set({
      userId: null,
      email: null,
      fullName: null,
      accessToken: null,
      activeScopeId: "FACULTY",
      roleScopes: [],
      authorities: []
    }),
  hasAuthority: (authority) => {
    const { authorities } = get();
    return authorities.includes("ROLE_STANDING_COMMITTEE") || authorities.includes(authority);
  }
}));
