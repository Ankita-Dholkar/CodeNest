import { useCallback } from 'react';
import { projectService } from '../services/projectService';
import { fileService } from '../services/fileService';
import { useProjectStore } from '../store/useProjectStore';
import { useFileStore } from '../store/useFileStore';
import { getLanguage } from '../utils/getLanguage';
import { emitRemoteFileDelete } from './useSocket';

export function useProject() {
  // ── Load project + files from DB ───────────────────────────────────────
  // IMPORTANT: We read Zustand actions via getState() inside the callback so we
  // don't need to list them as dependencies. Zustand actions are stable but their
  // identity is not guaranteed when destructured from the hook, which was causing
  // an infinite re-render loop (loadProject ref changed → useEffect re-ran → loop).
  const loadProject = useCallback(async (projectId) => {
    const { setProject, setSaveStatus } = useProjectStore.getState();
    const { hydrateFiles, resetFiles } = useFileStore.getState();
    try {
      resetFiles();
      const { project, files } = await projectService.getById(projectId);
      setProject(project);
      hydrateFiles(files);
      setSaveStatus('saved');
      return project;
    } catch (err) {
      console.error('[useProject] loadProject failed:', err);
    }
  }, []); // stable — no deps needed

  // ── Create project → then immediately load files from DB ───────────────
  const createProject = useCallback(async (name, description = '', template = 'react') => {
    const { setProject, setSaveStatus } = useProjectStore.getState();
    const { hydrateFiles, resetFiles } = useFileStore.getState();
    try {
      const project = await projectService.create({ name, description, template });
      setProject(project);
      resetFiles();
      const { files } = await projectService.getById(project._id);
      hydrateFiles(files);
      setSaveStatus('saved');
      return project;
    } catch (err) {
      console.error('[useProject] createProject failed:', err);
      throw err;
    }
  }, []); // stable — no deps needed

  // ── Add file (local + remote) ──────────────────────────────────────────
  const addFile = useCallback(async (projectId, path, content = '', language) => {
    const { createFile } = useFileStore.getState();
    const lang = language || getLanguage(path);
    const dbFile = await fileService.create({ projectId, path, content, language: lang });
    createFile(path, content, lang, dbFile._id);
  }, []); // stable

  // ── Delete file (local + remote) ───────────────────────────────────────
  const removeFile = useCallback(async (fileId, path) => {
    const { deleteFile } = useFileStore.getState();
    deleteFile(path);
    const projectId = useProjectStore.getState().project?._id;
    if (projectId) emitRemoteFileDelete(projectId, path);
    if (fileId) {
      try {
        await fileService.remove(fileId);
      } catch (err) {
        console.error('[useProject] removeFile failed:', err);
      }
    }
  }, []); // stable

  // ── Delete folder (local + remote) ─────────────────────────────────────
  const removeFolder = useCallback(async (folderPath) => {
    const { deleteFile, files } = useFileStore.getState();
    const prefix = folderPath + '/';
    const projectId = useProjectStore.getState().project?._id;

    const filesToDelete = Object.entries(files).filter(
      ([p]) => p.startsWith(prefix) || p === folderPath + '/.gitkeep' || p === folderPath
    );

    for (const [p, fileObj] of filesToDelete) {
      deleteFile(p);
      if (projectId) emitRemoteFileDelete(projectId, p);
      if (fileObj._id) {
        fileService.remove(fileObj._id).catch(err => console.error(err));
      }
    }
  }, []); // stable

  return { loadProject, createProject, addFile, removeFile, removeFolder };
}
