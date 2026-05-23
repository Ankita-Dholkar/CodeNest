import Editor from '@monaco-editor/react';
import { useRef, useCallback } from 'react';
import { useFileStore } from '../../store/useFileStore';
import { useProjectStore } from '../../store/useProjectStore';
import { fileService } from '../../services/fileService';
import { getLanguage } from '../../utils/getLanguage';

const EDITOR_OPTIONS = {
  fontSize: 13.5,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  tabSize: 2,
  wordWrap: 'on',
  smoothScrolling: true,
  cursorBlinking: 'expand',
  cursorSmoothCaretAnimation: 'on',
  padding: { top: 16, bottom: 16 },
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true },
  overviewRulerBorder: false,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
};

export default function MonacoEditor({ onFileChange }) {
  const { activeFile, files, updateFileContent } = useFileStore();
  const { project, setSaveStatus } = useProjectStore();
  const debounceTimer = useRef(null);

  const handleChange = useCallback(
    (value) => {
      if (!activeFile || value === undefined) return;

      // 1. Instant local update → Sandpack hot-reloads
      updateFileContent(activeFile, value);
      setSaveStatus('unsaved');

      // 2. Emit to socket so observers see live changes
      onFileChange?.(activeFile, value);

      // 3. Debounced persist to MongoDB (1.5s after user stops typing)
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        // Get _id directly from Zustand file store dynamically to avoid stale closure
        const fileId = useFileStore.getState().files[activeFile]?._id;
        if (!fileId) return; // file not yet persisted to DB
        setSaveStatus('saving');
        try {
          await fileService.update(fileId, value);
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
        }
      }, 1500);
    },
    [activeFile, updateFileContent, project, setSaveStatus, onFileChange]
  );

  const handleEditorMount = (editor, monaco) => {
    monaco.editor.defineTheme('codenest-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'e5c07b' },
        { token: 'type', foreground: '61afef' },
        { token: 'function', foreground: '61afef' },
        { token: 'variable', foreground: 'e06c75' },
      ],
      colors: {
        'editor.background': '#09090b',
        'editor.foreground': '#abb2bf',
        'editorLineNumber.foreground': '#3d3d3d',
        'editorLineNumber.activeForeground': '#858585',
        'editor.lineHighlightBackground': '#18181b',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#8b5cf6',
        'editorWhitespace.foreground': '#3b4048',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'scrollbarSlider.background': '#27272a',
        'scrollbarSlider.hoverBackground': '#3f3f46',
        'editorGutter.background': '#09090b',
      },
    });
    monaco.editor.setTheme('codenest-dark');
  };

  if (!activeFile || !files[activeFile]) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: '#3f3f46' }} className="font-mono text-sm">No file open</div>
        <div style={{ color: '#27272a' }} className="text-xs mt-1">
          Select a file from the explorer
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <Editor
        path={activeFile}
        value={files[activeFile]?.content || ''}
        language={files[activeFile]?.language || getLanguage(activeFile)}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={EDITOR_OPTIONS}
        loading={
          <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
            <span style={{ color: '#3f3f46' }} className="font-mono text-xs animate-pulse">
              Loading editor...
            </span>
          </div>
        }
      />
    </div>
  );
}
