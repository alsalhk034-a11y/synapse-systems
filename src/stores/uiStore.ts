import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  commandOpen: boolean
  focusMode: boolean
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
  openCommand: () => void
  closeCommand: () => void
  setFocusMode: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandOpen: false,
  focusMode: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (v) => set({ sidebarOpen: v }),
  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),
  setFocusMode: (v) => set({ focusMode: v }),
}))
