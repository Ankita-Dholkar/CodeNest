import { useState, useCallback, useRef, useEffect } from 'react';
import { FilePlus, FolderPlus, TerminalSquare, Package, X, AlertCircle } from 'lucide-react';
import MonacoEditor from '../Editor/MonacoEditor';
import EditorTabs from '../Editor/EditorTabs';
import SandpackPreview from '../Sandbox/SandpackPreview';
import FileTree from '../FileTree/FileTree';
import Terminal from '../Terminal/Terminal';
import PackageInstaller from '../Sandbox/PackageInstaller';
import { useProject } from '../../hooks/useProject';
import { useProjectStore } from '../../store/useProjectStore';

const iconBtn = { background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' };

const SIDEBAR_W = 220;
const PREVIEW_W = 380;

export default function ResizablePanels({ onFileChange }) {
  const { addFile } = useProject();
  const { project } = useProjectStore();
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('terminal'); // 'terminal' | 'console'
  const [pkgOpen, setPkgOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

  // Inline new-item input state (replaces prompt())
  const [newItem, setNewItem] = useState(null); // null | 'file' | 'folder'
  const [newItemName, setNewItemName] = useState('');
  const [createError, setCreateError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the input when it appears
  useEffect(() => {
    if (newItem) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [newItem]);

  const openNewItem = (type) => {
    setNewItem(type);
    setNewItemName('');
    setCreateError('');
  };

  const cancelNewItem = () => {
    setNewItem(null);
    setNewItemName('');
    setCreateError('');
  };

  const handleNewItemSubmit = async (e) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) return;
    const raw = name.startsWith('/') ? name : `/${name}`;
    const path = newItem === 'folder' ? `${raw}/.gitkeep` : raw;
    try {
      await addFile(project?._id, path);
      cancelNewItem();
    } catch {
      setCreateError(`Could not create "${name}" — check the server connection.`);
    }
  };

  // Drag state for panel resizing
  const [sidebarW, setSidebarW] = useState(SIDEBAR_W);
  const [previewW, setPreviewW] = useState(PREVIEW_W);
  const [terminalH, setTerminalH] = useState(200);

  const startDragSidebar = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarW;
    const onMove = (me) => {
      const next = Math.max(160, Math.min(380, startW + (me.clientX - startX)));
      setSidebarW(next);
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarW]);

  const startDragPreview = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = previewW;
    const onMove = (me) => {
      const next = Math.max(260, Math.min(600, startW - (me.clientX - startX)));
      setPreviewW(next);
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [previewW]);

  const startDragTerminal = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = terminalH;
    const onMove = (me) => {
      // When dragging UP, clientY decreases, so we increase height
      const next = Math.max(100, Math.min(800, startH - (me.clientY - startY)));
      setTerminalH(next);
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [terminalH]);

  const outerH = 'calc(100vh - 3.5rem)';

  return (
    <div style={{ height: outerH, display: 'flex', width: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div style={{
        width: sidebarW,
        minWidth: sidebarW,
        maxWidth: sidebarW,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#18181b',
        borderRight: '1px solid #27272a',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Explorer header */}
        <div style={{
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: newItem ? 'none' : '1px solid #27272a',
          flexShrink: 0,
        }}>
          <span style={{ color: '#52525b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
            Explorer
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => openNewItem('file')} title="New File" style={iconBtn}>
              <FilePlus size={14} />
            </button>
            <button onClick={() => openNewItem('folder')} title="New Folder" style={iconBtn}>
              <FolderPlus size={14} />
            </button>
          </div>
        </div>

        {/* Inline new-item input */}
        {newItem && (
          <form
            onSubmit={handleNewItemSubmit}
            style={{ padding: '6px 10px', borderBottom: '1px solid #27272a', flexShrink: 0 }}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && cancelNewItem()}
                placeholder={newItem === 'file' ? 'Component.jsx' : 'components'}
                style={{
                  flex: 1, fontSize: '11px', fontFamily: 'monospace',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: '4px', color: '#e4e4e7',
                  padding: '3px 7px', outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{ ...iconBtn, color: '#8b5cf6', padding: '3px' }}
                title="Create"
              >
                <FilePlus size={13} />
              </button>
              <button
                type="button"
                onClick={cancelNewItem}
                style={{ ...iconBtn, padding: '3px' }}
                title="Cancel"
              >
                <X size={13} />
              </button>
            </div>
            {createError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', color: '#f87171' }}>
                <AlertCircle size={10} />
                {createError}
              </div>
            )}
          </form>
        )}

        {/* File Tree */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <FileTree />
        </div>
      </div>

      {/* Sidebar resize handle */}
      <div
        onMouseDown={startDragSidebar}
        style={{ width: '4px', cursor: 'col-resize', backgroundColor: 'transparent', flexShrink: 0, zIndex: 20 }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8b5cf6'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      />

      {/* ── EDITOR COLUMN ───────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#09090b',
        overflow: 'hidden',
      }}>
        {/* Tabs + toolbar row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #27272a',
          flexShrink: 0,
          height: '36px',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', height: '100%' }}>
            <EditorTabs />
          </div>
          {/* Toolbar icons */}
          <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #27272a', height: '100%', flexShrink: 0 }}>
            <button
              title="Install npm package"
              onClick={() => setPkgOpen(o => !o)}
              style={{ ...iconBtn, color: pkgOpen ? '#8b5cf6' : '#52525b', padding: '0 10px', height: '100%' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
              onMouseLeave={e => e.currentTarget.style.color = pkgOpen ? '#8b5cf6' : '#52525b'}
            >
              <Package size={14} />
            </button>
            <button
              title="Toggle Bottom Panel"
              onClick={() => setBottomPanelOpen(o => !o)}
              style={{ ...iconBtn, color: bottomPanelOpen ? '#8b5cf6' : '#52525b', padding: '0 10px', height: '100%' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
              onMouseLeave={e => e.currentTarget.style.color = bottomPanelOpen ? '#8b5cf6' : '#52525b'}
            >
              <TerminalSquare size={14} />
            </button>
            <button
              title="Toggle Live Preview"
              onClick={() => setPreviewOpen(o => !o)}
              style={{ ...iconBtn, color: previewOpen ? '#8b5cf6' : '#52525b', padding: '0 10px', height: '100%', borderLeft: '1px solid #27272a' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
              onMouseLeave={e => e.currentTarget.style.color = previewOpen ? '#8b5cf6' : '#52525b'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        {/* Package installer bar */}
        {pkgOpen && (
          <div style={{ flexShrink: 0, borderBottom: '1px solid #27272a' }}>
            <PackageInstaller onClose={() => setPkgOpen(false)} />
          </div>
        )}

        {/* Monaco Editor — fills remaining height */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <MonacoEditor onFileChange={onFileChange} />
        </div>

        {/* Terminal resize handle */}
        {bottomPanelOpen && (
          <div
            onMouseDown={startDragTerminal}
            style={{ height: '4px', cursor: 'row-resize', backgroundColor: '#27272a', flexShrink: 0, zIndex: 20 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8b5cf6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#27272a'}
          />
        )}

        {/* Bottom Panel (Terminal & Console) */}
        <div style={{ display: bottomPanelOpen ? 'flex' : 'none', flexDirection: 'column', height: terminalH, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ height: '30px', display: 'flex', backgroundColor: '#18181b', borderBottom: '1px solid #27272a' }}>
            <button
              onClick={() => setActiveBottomTab('terminal')}
              style={{ padding: '0 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: activeBottomTab === 'terminal' ? '#e4e4e7' : '#71717a', borderBottom: activeBottomTab === 'terminal' ? '1px solid #8b5cf6' : 'none', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
            >
              Terminal
            </button>
            <button
              onClick={() => setActiveBottomTab('console')}
              style={{ padding: '0 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: activeBottomTab === 'console' ? '#e4e4e7' : '#71717a', borderBottom: activeBottomTab === 'console' ? '1px solid #8b5cf6' : 'none', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
            >
              Console
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: activeBottomTab === 'terminal' ? 'block' : 'none', height: '100%' }}>
              <Terminal onClose={() => setBottomPanelOpen(false)} onMinimize={() => setBottomPanelOpen(false)} />
            </div>
            {/* The portal target for SandpackConsole */}
            <div id="sandpack-console-portal" style={{ display: activeBottomTab === 'console' ? 'block' : 'none', height: '100%', backgroundColor: '#09090b' }} />
          </div>
        </div>
      </div>

      {previewOpen && (
        <>
          {/* Preview resize handle */}
          <div
            onMouseDown={startDragPreview}
            style={{ width: '4px', cursor: 'col-resize', backgroundColor: 'transparent', flexShrink: 0, zIndex: 20 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#8b5cf6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          />

          {/* ── PREVIEW COLUMN ──────────────────────────────────────── */}
          <div style={{
            width: previewW,
            minWidth: previewW,
            maxWidth: previewW,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#18181b',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
        {/* Browser chrome bar */}
        <div style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 14px',
          borderBottom: '1px solid #27272a',
          backgroundColor: 'rgba(24,24,27,0.9)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239,68,68,0.75)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(234,179,8,0.75)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(34,197,94,0.75)' }} />
          </div>
          <div style={{
            flex: 1, height: 24, background: '#09090b', border: '1px solid #27272a', borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontFamily: 'monospace', color: '#52525b',
          }}>
            sandbox://localhost
          </div>
        </div>

        {/* Sandpack — takes all remaining height */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <SandpackPreview />
        </div>
      </div>
    </>
  )}

    </div>
  );
}
