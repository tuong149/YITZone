import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";
export type WorkspaceSurface = "public" | "student" | "admin" | "stage";

const THEME_STORAGE_KEY = "yitzone-theme";

function resolveDark(theme: ThemePreference): boolean {
  if (typeof window === "undefined") return false;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemeToDocument(theme: ThemePreference): boolean {
  const isDark = resolveDark(theme);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", isDark);
  }
  return isDark;
}

function readInitialTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return "system";
}

interface ThemeState {
  theme: ThemePreference;
  isDark: boolean;
  surface: WorkspaceSurface;
  setTheme: (theme: ThemePreference) => void;
  setSurface: (surface: WorkspaceSurface) => void;
}

const initialTheme = readInitialTheme();

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  isDark: applyThemeToDocument(initialTheme),
  surface: "student",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    const isDark = applyThemeToDocument(theme);
    set({ theme, isDark });
  },
  setSurface: (surface) => set({ surface })
}));

if (typeof window !== "undefined") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    const current = useThemeStore.getState().theme;
    if (current === "system") {
      useThemeStore.setState({ isDark: applyThemeToDocument("system") });
    }
  });
}
