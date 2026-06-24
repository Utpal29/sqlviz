import { create } from "zustand";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "sqlviz.theme";

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

function loadStoredMode(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    // ignore
  }
  return null;
}

function systemMode(): ThemeMode {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function initialMode(): ThemeMode {
  return loadStoredMode() ?? systemMode();
}

function applyMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}

function persistMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

const startMode = initialMode();
applyMode(startMode);

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: startMode,
  setMode: (mode) => {
    applyMode(mode);
    persistMode(mode);
    set({ mode });
  },
  toggle: () => {
    const next: ThemeMode = get().mode === "dark" ? "light" : "dark";
    applyMode(next);
    persistMode(next);
    set({ mode: next });
  },
}));
