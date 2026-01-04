import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebar: (open: boolean) => void;
  setRightSidebar: (open: boolean) => void;
  closeAllSidebars: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setLeftSidebar: (open) => set({ leftSidebarOpen: open }),
      setRightSidebar: (open) => set({ rightSidebarOpen: open }),
      closeAllSidebars: () =>
        set({ leftSidebarOpen: false, rightSidebarOpen: false }),
    }),
    {
      name: "sidebar-storage",
    }
  )
);
