import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useFileStore } from '../store/useFileStore';

// A single socket connection is shared for the lifetime of the browser tab.
// We keep it outside React so it isn't re-created on re-renders, but we
// manage room membership carefully inside the hook.
let sharedSocket = null;

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    sharedSocket.on('connect', () => {
      console.log('🟢 [WebSocket] Connected successfully:', sharedSocket.id);
    });

    sharedSocket.on('disconnect', () => {
      console.log('🔴 [WebSocket] Disconnected from server');
    });

    sharedSocket.on('connect_error', (err) => {
      console.error('⚠️ [WebSocket] Connection error:', err.message);
    });
  }
  return sharedSocket;
}

/**
 * Connects to Socket.io, joins the project room, and listens for
 * remote file-update events to keep the editor in sync.
 *
 * @param {string|null} projectId  — MongoDB project _id
 */
export function useSocket(projectId) {
  const prevProjectIdRef = useRef(null);
  const { updateFileContent } = useFileStore();

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();

    // Leave the previous project room before joining the new one.
    // This is the critical fix: without this, events from the old project
    // continue to arrive and corrupt the current editor state.
    if (prevProjectIdRef.current && prevProjectIdRef.current !== projectId) {
      socket.emit('leave-project', prevProjectIdRef.current);
    }

    socket.emit('join-project', projectId);
    prevProjectIdRef.current = projectId;

    // Receive remote file edits and update local Zustand store
    const handleFileUpdate = ({ path, content }) => {
      updateFileContent(path, content);
    };
    socket.on('file-update', handleFileUpdate);

    // Receive remote file deletions
    const handleFileRemove = ({ path }) => {
      useFileStore.getState().deleteFile(path);
    };
    socket.on('file-remove', handleFileRemove);

    return () => {
      socket.off('file-update', handleFileUpdate);
      socket.off('file-remove', handleFileRemove);
      socket.emit('leave-project', projectId);
      prevProjectIdRef.current = null;
    };
  }, [projectId, updateFileContent]);

  /**
   * Emit a file change to the server so other connected clients get it.
   */
  const emitFileChange = useCallback((projectId, path, content) => {
    getSocket().emit('file-change', { projectId, path, content });
  }, []);

  return { emitFileChange };
}

export function emitRemoteFileDelete(projectId, path) {
  if (sharedSocket) {
    sharedSocket.emit('file-delete', { projectId, path });
  }
}
