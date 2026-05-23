import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import ContextMenu from './ContextMenu';
import { useFileStore } from '../../store/useFileStore';
import { getFileIcon } from '../../utils/fileIcons';

// Build nested tree from flat { '/path': ... } object
function buildTree(files) {
  const root = {};
  Object.keys(files).forEach((path) => {
    const parts = path.replace(/^\//, '').split('/').filter(Boolean);
    let node = root;
    let currentPath = '';
    parts.forEach((part, i) => {
      currentPath += '/' + part;
      if (!node[part]) {
        node[part] = i === parts.length - 1 
          ? { __file: path, __fullPath: currentPath } 
          : { __dir: true, __fullPath: currentPath };
      }
      if (i < parts.length - 1) node = node[part];
    });
  });
  return root;
}

function TreeNode({ name, node, depth }) {
  const isFile = !!node.__file;
  const [open, setOpen] = useState(true);
  const [ctxMenu, setCtxMenu] = useState(null);
  const { activeFile, setActiveFile } = useFileStore();
  const isActive = isFile && activeFile === node.__file;
  const { icon, color } = getFileIcon(name);

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingLeft: `${12 + depth * 14}px`,
    paddingRight: '8px',
    paddingTop: '3px',
    paddingBottom: '3px',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: isActive ? 'rgba(139,92,246,0.18)' : 'transparent',
    borderLeft: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
    color: isActive ? '#e4e4e7' : '#a1a1aa',
    transition: 'background 0.1s',
  };

  return (
    <>
      <div
        style={rowStyle}
        onClick={() => isFile ? setActiveFile(node.__file) : setOpen(o => !o)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Chevron for folders */}
        <span style={{ color: '#3f3f46', width: 14, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {!isFile && (open
            ? <ChevronDown size={13} />
            : <ChevronRight size={13} />
          )}
        </span>

        {/* File/folder icon */}
        <span style={{ fontSize: '10px', fontWeight: 700, color: isFile ? color : '#a78bfa', flexShrink: 0, minWidth: '14px' }}>
          {isFile ? icon : (open ? '📂' : '📁')}
        </span>

        {/* Name */}
        <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>

      {/* Recurse into folder children */}
      {!isFile && open && (
        Object.entries(node)
          .filter(([k]) => k !== '__dir' && k !== '__file' && k !== '.gitkeep')
          .sort(([, a], [, b]) => {
            const aIsFile = !!a.__file; const bIsFile = !!b.__file;
            if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
            return 0;
          })
          .map(([childName, childNode]) => (
            <TreeNode key={childName} name={childName} node={childNode} depth={depth + 1} />
          ))
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          path={node.__fullPath}
          isFile={isFile}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}

export default function FileTree() {
  const files = useFileStore(s => s.files);

  if (Object.keys(files).length === 0) {
    return (
      <div style={{ padding: '16px 12px', color: '#3f3f46', fontSize: '12px', fontFamily: 'monospace' }}>
        No files yet
      </div>
    );
  }

  const tree = buildTree(files);

  return (
    <div style={{ paddingTop: '6px', paddingBottom: '6px' }}>
      {Object.entries(tree)
        .filter(([k]) => k !== '__dir' && k !== '__file' && k !== '.gitkeep')
        .sort(([, a], [, b]) => {
          const aIsFile = !!a.__file; const bIsFile = !!b.__file;
          if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
          return 0;
        })
        .map(([name, node]) => (
          <TreeNode key={name} name={name} node={node} depth={0} />
        ))}
    </div>
  );
}
