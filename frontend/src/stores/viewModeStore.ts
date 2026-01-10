import { create } from "zustand";

type ViewMode = "cards" | "data_collection" | "chat";

interface ViewModeState {
  viewMode: ViewMode;
  resetTrigger: number;
  setViewMode: (mode: ViewMode) => void;
  resetToCards: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  viewMode: "cards",
  resetTrigger: 0,
  setViewMode: (mode) => set({ viewMode: mode }),
  resetToCards: () => set((state) => ({
    viewMode: "cards",
    resetTrigger: state.resetTrigger + 1
  })),
}));
