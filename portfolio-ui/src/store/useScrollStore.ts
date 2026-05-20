import { create } from 'zustand';

interface ScrollState {
  scrollProgress: number;
  activeSection: string;
  setScrollProgress: (progress: number) => void;
  setActiveSection: (section: string) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollProgress: 0,
  activeSection: 'hero',
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setActiveSection: (section) => set({ activeSection: section }),
}));
