import { create } from "zustand";
import { STARTER_QUERIES } from "../datasets/starters";

export type EditorBuffer = "main" | "compareA" | "compareB";

interface EditorStore {
  query: string;
  activeBuffer: EditorBuffer;
  setQuery: (q: string) => void;
  setActiveBuffer: (buffer: EditorBuffer) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  query: STARTER_QUERIES.ecommerce,
  activeBuffer: "main",
  setQuery: (q) => set({ query: q }),
  setActiveBuffer: (buffer) => set({ activeBuffer: buffer }),
}));
