import { create } from 'zustand';

export const useFileStore = create((set, get) => ({
  // Virtual file system: { '/path': { content, language, _id } }
  // Starts empty — always populated from DB
  files: {},

  // Tabs management
  openTabs: [],
  activeFile: null,

  // ── Actions ───────────────────────────────────────────────────────────

  /** Load all files from DB into the store at once */
  hydrateFiles: (dbFiles) => {
    // dbFiles: Array<{ _id, path, content, language }>
    const files = {};
    dbFiles.forEach(({ _id, path, content, language }) => {
      files[path] = { content, language, _id };
    });

    // Auto-open the first file
    const firstPath = Object.keys(files)[0] || null;
    set({ files, openTabs: firstPath ? [firstPath] : [], activeFile: firstPath });
  },

  /** Reset store when switching projects */
  resetFiles: () => set({ files: {}, openTabs: [], activeFile: null }),

  setActiveFile: (path) => {
    const { openTabs } = get();
    if (!openTabs.includes(path)) {
      set({ openTabs: [...openTabs, path], activeFile: path });
    } else {
      set({ activeFile: path });
    }
  },

  closeTab: (path) => {
    const { openTabs, activeFile } = get();
    const newTabs = openTabs.filter((t) => t !== path);
    let newActive = activeFile;
    if (activeFile === path) {
      const idx = openTabs.indexOf(path);
      newActive = newTabs[idx - 1] || newTabs[0] || null;
    }
    set({ openTabs: newTabs, activeFile: newActive });
  },

  updateFileContent: (path, content) => {
    const { files } = get();
    if (!files[path]) return;
    set({ files: { ...files, [path]: { ...files[path], content } } });
  },

  /** Add a file to the store (with optional DB _id) */
  createFile: (path, content = '', language = 'javascript', _id = null) => {
    const { files, openTabs } = get();
    set({
      files: { ...files, [path]: { content, language, _id } },
      openTabs: openTabs.includes(path) ? openTabs : [...openTabs, path],
      activeFile: path,
    });
  },

  deleteFile: (path) => {
    const { files, openTabs, activeFile } = get();
    const newFiles = { ...files };
    delete newFiles[path];
    const newTabs = openTabs.filter((t) => t !== path);
    const newActive = activeFile === path ? newTabs[0] || null : activeFile;
    set({ files: newFiles, openTabs: newTabs, activeFile: newActive });
  },

  /** Convert to Sandpack format — filters out folder placeholders */
  getSandpackFiles: () => {
    const { files } = get();
    const sandpackFiles = {};
    Object.entries(files).forEach(([path, { content }]) => {
      if (!path.endsWith('.gitkeep')) {
        sandpackFiles[path] = { code: content };
      }
    });
    return sandpackFiles;
  },
}));
