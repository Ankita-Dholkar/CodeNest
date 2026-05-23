import { Code2, Play, Save, CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useFileStore } from '../../store/useFileStore';
import { fileService } from '../../services/fileService';

export default function Navbar() {
  const { saveStatus, project, setSaveStatus, incrementRefresh, clearProject } = useProjectStore();
  const { activeFile, files } = useFileStore();

  const handleSave = async () => {
    if (!activeFile || !files[activeFile]) return;
    const fileId = files[activeFile]?._id;
    if (!fileId) return;
    setSaveStatus('saving');
    try {
      await fileService.update(fileId, files[activeFile].content);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  };

  const handleSwitchProject = () => {
    localStorage.removeItem('codenest_projectId');
    clearProject();
    window.location.reload(); // Ensures perfectly clean state for next project
  };

  return (
    <nav
      className="h-14 flex items-center justify-between px-4 select-none flex-shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Brand & Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSwitchProject}
          title="Switch Project"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-zinc-800 mx-1"></div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            <Code2 className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          </div>
          <span className="font-semibold text-sm text-gray-100 tracking-wide">CodeNest</span>
          <span className="text-gray-600 text-sm">/</span>
          <span className="text-gray-400 text-sm font-mono">{project?.name || 'untitled'}</span>
        </div>
      </div>

      {/* Save Status */}
      <div className="flex items-center gap-1.5 text-xs">
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
            <span className="text-yellow-400">Saving...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-500">Saved</span>
          </>
        )}
        {saveStatus === 'unsaved' && (
          <>
            <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <span style={{ color: '#f59e0b' }}>Unsaved changes</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saved' || saveStatus === 'saving' || !activeFile}
          title={!activeFile ? 'Open a file to save' : 'Save current file (Ctrl+S)'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white rounded-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = '#52525b'; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
        <button
          onClick={incrementRefresh}
          title="Force-refresh the live preview"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md transition-all duration-150"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: '0 0 12px rgba(59,130,246,0.25)',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Run</span>
        </button>
      </div>
    </nav>
  );
}
