import { create } from "zustand";
import type { DatasetName } from "../types/database";

const STORAGE_KEY = "sqlviz.queryHistory";
const MAX_HISTORY = 20;

export interface QueryHistoryItem {
  id: string;
  query: string;
  dataset: DatasetName;
  timestamp: number;
  rowCount: number;
  executionTimeMs: number;
  hasPlan: boolean;
}

interface HistoryStore {
  items: QueryHistoryItem[];
  addItem: (item: Omit<QueryHistoryItem, "id" | "timestamp">) => void;
  deleteItem: (id: string) => void;
  clearHistory: () => void;
}

function loadHistory(): QueryHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueryHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: QueryHistoryItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  items: loadHistory(),

  addItem: (item) => {
    const trimmed = item.query.trim();
    if (!trimmed) return;
    const nextItem: QueryHistoryItem = {
      ...item,
      query: trimmed,
      id: `${Date.now()}-${trimmed.slice(0, 16)}`,
      timestamp: Date.now(),
    };
    const deduped = get().items.filter(
      (existing) => existing.query !== trimmed || existing.dataset !== item.dataset
    );
    const next = [nextItem, ...deduped].slice(0, MAX_HISTORY);
    saveHistory(next);
    set({ items: next });
  },

  deleteItem: (id) => {
    const next = get().items.filter((item) => item.id !== id);
    saveHistory(next);
    set({ items: next });
  },

  clearHistory: () => {
    saveHistory([]);
    set({ items: [] });
  },
}));
