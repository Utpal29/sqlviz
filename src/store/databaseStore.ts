import { create } from "zustand";
import { databaseEngine } from "../engine/database";
import type { DatabaseSchema, DatasetName } from "../types/database";

type Status = "idle" | "initializing" | "ready" | "error";

interface DatabaseStore {
  status: Status;
  errorMessage: string | null;
  currentDataset: DatasetName;
  schema: DatabaseSchema | null;
  init: () => Promise<void>;
  loadDataset: (name: DatasetName) => Promise<void>;
  resetDataset: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  status: "idle",
  errorMessage: null,
  currentDataset: "ecommerce",
  schema: null,

  init: async () => {
    set({ status: "initializing", errorMessage: null });
    try {
      await databaseEngine.loadDataset("ecommerce");
      set({
        status: "ready",
        currentDataset: "ecommerce",
        schema: databaseEngine.getSchema(),
      });
    } catch (e) {
      set({
        status: "error",
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  },

  loadDataset: async (name) => {
    set({ status: "initializing", errorMessage: null });
    try {
      await databaseEngine.loadDataset(name);
      set({
        status: "ready",
        currentDataset: name,
        schema: databaseEngine.getSchema(),
      });
    } catch (e) {
      set({
        status: "error",
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  },

  resetDataset: async () => {
    const name = databaseEngine.currentDataset;
    set({ status: "initializing", errorMessage: null });
    try {
      await databaseEngine.loadDataset(name);
      set({
        status: "ready",
        currentDataset: name,
        schema: databaseEngine.getSchema(),
      });
    } catch (e) {
      set({
        status: "error",
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
