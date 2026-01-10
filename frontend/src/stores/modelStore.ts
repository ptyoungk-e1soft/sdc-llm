import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OllamaModel } from "@/types/model";

const DEFAULT_MODEL = "qwen3:32b";

interface ModelStore {
  models: OllamaModel[];
  selectedModel: string;
  defaultModel: string;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  setModels: (models: OllamaModel[]) => void;
  setSelectedModel: (model: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchModels: () => Promise<void>;
  fetchDefaultModel: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      models: [],
      selectedModel: DEFAULT_MODEL,
      defaultModel: DEFAULT_MODEL,
      isLoading: false,
      error: null,
      initialized: false,
      setModels: (models) => set({ models }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      fetchModels: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/models");
          if (!response.ok) {
            throw new Error("Failed to fetch models");
          }
          const data = await response.json();
          set({ models: data.models, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isLoading: false,
          });
        }
      },
      fetchDefaultModel: async () => {
        try {
          const response = await fetch("/api/settings/default-model");
          if (response.ok) {
            const data = await response.json();
            set({ defaultModel: data.defaultModel });
            return;
          }
        } catch (error) {
          console.error("Failed to fetch default model:", error);
        }
        set({ defaultModel: DEFAULT_MODEL });
      },
      initializeStore: async () => {
        const state = get();
        if (state.initialized) return;

        // Fetch default model from server
        await state.fetchDefaultModel();

        // If no model is selected (first time), use server default
        const currentDefault = get().defaultModel;
        if (!state.selectedModel || state.selectedModel === DEFAULT_MODEL) {
          set({ selectedModel: currentDefault });
        }

        set({ initialized: true });
      },
    }),
    {
      name: "model-storage",
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);
