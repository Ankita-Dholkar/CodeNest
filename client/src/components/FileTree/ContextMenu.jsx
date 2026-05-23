import { useEffect, useRef, useState } from 'react';
import { FilePlus, FolderPlus, Trash2 } from 'lucide-react';
import { useFileStore } from '../../store/useFileStore';
import { useProject } from '../../hooks/useProject';
import { useProjectStore } from '../../store/useProjectStore';

export default function ContextMenu({ x, y, path, isFile, onClose }) {
  const menuRef = useRef(null);
  const { createFile, files } = useFileStore();
  const { addFile, removeFile, removeFolder } = useProject();
  const { project } = useProjectStore();
  const [creating, setCreating] = useState(null);
  const [inputVal, setInputVal] = useState('');

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Adjust if menu goes off screen
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  const handleCreate = (type) => {
    setCreating(type);
    setInputVal('');
  };

  const handleDelete = () => {
    if (isFile) {
      const fileId = files[path]?._id;
      removeFile(fileId, path);
    } else {
      removeFolder(path);
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const dir = isFile ? path.substring(0, path.lastIndexOf('/')) : path;
    const newPath = creating === 'file'
      ? `${dir}/${inputVal.trim()}`
      : `${dir}/${inputVal.trim()}/.gitkeep`;
    await addFile(project?._id, newPath, '', 'plaintext');
    onClose();
  };

  const menuItems = [
    { label: 'New File', icon: <FilePlus className="w-3.5 h-3.5" />, action: () => handleCreate('file') },
    { label: 'New Folder', icon: <FolderPlus className="w-3.5 h-3.5" />, action: () => handleCreate('folder') },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, action: handleDelete, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 py-1 rounded-lg shadow-2xl min-w-[160px]"
      style={{
        top: adjustedY,
        left: adjustedX,
        backgroundColor: '#1c1c1f',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}
    >
      {!creating ? (
        menuItems.map(({ label, icon, action, danger }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors duration-100"
            style={{ color: danger ? '#f87171' : '#a1a1aa' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = danger ? '#fca5a5' : '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = danger ? '#f87171' : '#a1a1aa';
            }}
          >
            {icon}
            {label}
          </button>
        ))
      ) : (
        <form onSubmit={handleSubmit} className="px-2 py-1.5">
          <p className="text-[10px] mb-1.5" style={{ color: '#52525b' }}>
            {creating === 'file' ? 'New file name:' : 'New folder name:'}
          </p>
          <input
            autoFocus
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            placeholder={creating === 'file' ? 'Component.jsx' : 'components'}
            className="w-full text-xs px-2 py-1 rounded outline-none font-mono"
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-accent)',
              color: '#e4e4e7',
            }}
          />
          <div className="flex gap-1.5 mt-1.5">
            <button type="submit" className="flex-1 text-[10px] py-1 rounded" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
              Create
            </button>
            <button type="button" onClick={onClose} className="flex-1 text-[10px] py-1 rounded" style={{ backgroundColor: 'var(--color-border)', color: '#a1a1aa' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
