import { X } from 'lucide-react';
import { useFileStore } from '../../store/useFileStore';
import { getFileIcon } from '../../utils/fileIcons';

export default function EditorTabs() {
  const { openTabs, activeFile, setActiveFile, closeTab } = useFileStore();
  if (openTabs.length === 0) return null;

  return (
    <div
      className="flex overflow-x-auto flex-shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(24,24,27,0.4)' }}
    >
      {openTabs.map((path) => {
        const isActive = path === activeFile;
        const filename = path.split('/').pop();
        const { icon, color } = getFileIcon(path);

        return (
          <div
            key={path}
            onClick={() => setActiveFile(path)}
            className="group relative flex items-center gap-2 px-4 h-9 text-[11px] font-mono cursor-pointer select-none flex-shrink-0 transition-colors duration-100"
            style={{
              borderRight: '1px solid var(--color-border)',
              borderTop: isActive
                ? `2px solid var(--color-accent)`
                : '2px solid transparent',
              backgroundColor: isActive ? 'var(--color-background)' : 'transparent',
              color: isActive ? '#e4e4e7' : '#71717a',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(9,9,11,0.6)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="text-[10px] font-bold" style={{ color: isActive ? color : '#3f3f46' }}>
              {icon}
            </span>
            <span>{filename}</span>
            {openTabs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(path); }}
                className="opacity-0 group-hover:opacity-100 ml-0.5 p-0.5 rounded transition-all"
                style={{ color: '#71717a' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3f3f46'; e.currentTarget.style.color = '#e4e4e7'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#71717a'; }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
