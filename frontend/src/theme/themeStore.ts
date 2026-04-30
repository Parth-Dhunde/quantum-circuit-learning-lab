import { create } from "zustand";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "qc-lab-theme";

export function applyThemeMode(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode / quota */
  }
}

export function readStoredTheme(): ThemeMode {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "light") return "light";
  } catch {
    /* ignore */
  }
  return "dark";
}

/** Keep DOM in sync when the module loads (after optional inline HTML script). */
applyThemeMode(readStoredTheme());

type ThemeState = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readStoredTheme(),
  setMode: (m) => {
    applyThemeMode(m);
    set({ mode: m });
  },
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    get().setMode(next);
  },
}));
