import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OllamaModel } from "@/types/model";

interface ModelStore {
  models: OllamaModel[];
  selectedModel: string;
  isLoading: boolean;
  error: string | null;
  setModels: (models: OllamaModel[]) => void;
  setSelectedModel: (model: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchModels: () => Promise<void>;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      models: [],
      selectedModel: "qwen3:32b",
      isLoading: false,
      error: null,
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
    }),
    {
      name: "model-storage",
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);
