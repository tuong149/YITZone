import { create } from "zustand";

/** @typedef {"system" | "light" | "dark"} ThemePreference */
/** @typedef {"student" | "admin" | "stage"} WorkspaceSurface */

const THEME_STORAGE_KEY = "yitzone-theme";

function resolveDark(theme) {
  if (typeof window === "undefined") return false;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemeToDocument(theme) {
  const isDark = resolveDark(theme);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", isDark);
  }
  return isDark;
}

function readInitialTheme() {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return "system";
}

const initialTheme = readInitialTheme();

export const useThemeStore = create((set) => ({
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
