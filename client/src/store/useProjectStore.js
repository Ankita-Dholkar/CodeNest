import { create } from 'zustand';

export const useProjectStore = create((set) => ({
  project: null,
  isSaving: false,
  saveStatus: 'saved', // 'saved' | 'saving' | 'unsaved'
  refreshCount: 0,     // bumped to force-refresh the Sandpack preview

  setProject: (project) => set({ project }),
  clearProject: () => set({ project: null }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setIsSaving: (val) => set({ isSaving: val }),
  incrementRefresh: () => set((s) => ({ refreshCount: s.refreshCount + 1 })),
}));
