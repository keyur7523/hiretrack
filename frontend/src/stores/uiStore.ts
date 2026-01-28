import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsHelpOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openShortcutsHelp: () => void;
  closeShortcutsHelp: () => void;
  toggleShortcutsHelp: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isCommandPaletteOpen: false,
      isShortcutsHelpOpen: false,

      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

      openShortcutsHelp: () => set({ isShortcutsHelpOpen: true }),
      closeShortcutsHelp: () => set({ isShortcutsHelpOpen: false }),
      toggleShortcutsHelp: () => set((state) => ({ isShortcutsHelpOpen: !state.isShortcutsHelpOpen })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
