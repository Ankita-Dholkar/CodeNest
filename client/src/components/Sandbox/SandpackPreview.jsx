import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview as SPPreview,
  SandpackConsole,
} from '@codesandbox/sandpack-react';
import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFileStore } from '../../store/useFileStore';
import { useProjectStore } from '../../store/useProjectStore';

const sandpackTheme = {
  colors: {
    surface1: '#09090b',
    surface2: '#18181b',
    surface3: '#27272a',
    clickable: '#6b7280',
    base: '#abb2bf',
    disabled: '#3f3f46',
    hover: '#e5e5e5',
    accent: '#8b5cf6',
    error: '#f87171',
    errorSurface: '#3b0f0f',
  },
  syntax: {
    plain: '#abb2bf',
    comment: { color: '#5c6370', fontStyle: 'italic' },
    keyword: '#c678dd',
    tag: '#e06c75',
    punctuation: '#abb2bf',
    definition: '#61afef',
    property: '#e06c75',
    static: '#d19a66',
    string: '#98c379',
  },
  font: {
    body: 'Inter, sans-serif',
    mono: "'JetBrains Mono', monospace",
    size: '13px',
    lineHeight: '1.6',
  },
};

// Map project template to Sandpack template
const TEMPLATE_MAP = {
  react: 'react',
  vanilla: 'vanilla',
  node: 'node',
};

const BASE_DEPS = { react: '^18.0.0', 'react-dom': '^18.0.0' };

export default function SandpackPreview() {
  const rawFiles = useFileStore(s => s.files);
  const { project, refreshCount } = useProjectStore();

  // Convert internal file store format → Sandpack format, skipping placeholders
  const files = useMemo(() => {
    const sandpackFiles = {};
    Object.entries(rawFiles).forEach(([path, { content }]) => {
      if (!path.endsWith('.gitkeep')) {
        sandpackFiles[path] = { code: content };
      }
    });

    // CRITICAL FIX: Sandpack has hidden default files (like App.js and index.js).
    // If a user deletes them to write pure HTML, Sandpack resurrects its defaults
    // which inject "Hello world". We explicitly stub them out if they are missing.
    let template = TEMPLATE_MAP[project?.template] || 'react';
    if (template === 'react') {
      if (!sandpackFiles['/App.js'] && !sandpackFiles['/App.jsx']) {
        sandpackFiles['/App.js'] = { code: '' }; // Kill default Hello World
      }
      if (!sandpackFiles['/index.js'] && !sandpackFiles['/index.jsx']) {
        sandpackFiles['/index.js'] = { code: '' };
      }
    } else if (template === 'vanilla') {
      if (!sandpackFiles['/index.js']) {
        sandpackFiles['/index.js'] = { code: '' }; // Kill default Vanilla injection
      }
    }

    return sandpackFiles;
  }, [rawFiles, project?.template]);

  // If there's an index.html but NO javascript entry files, use static template
  // so the pure HTML renders correctly instead of blanking out.
  let activeTemplate = TEMPLATE_MAP[project?.template] || 'react';
  if (
    files['/index.html'] && 
    (!files['/index.js'] || !files['/index.js'].code) && 
    (!files['/App.js'] || !files['/App.js'].code)
  ) {
    activeTemplate = 'static';
  }

  // Find portal target for console
  const [consoleTarget, setConsoleTarget] = useState(null);
  useEffect(() => {
    setConsoleTarget(document.getElementById('sandpack-console-portal'));
  }, []);

  // Read dependencies from the virtual /package.json so PackageInstaller works.
  // Merge with base deps so react/react-dom are always present.
  const dependencies = useMemo(() => {
    const pkgFile = rawFiles['/package.json'];
    if (!pkgFile?.content) return BASE_DEPS;
    try {
      const parsed = JSON.parse(pkgFile.content);
      return { ...BASE_DEPS, ...(parsed.dependencies || {}) };
    } catch {
      return BASE_DEPS;
    }
  }, [rawFiles]);

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* 
        CRITICAL FIX: Sandpack's --sp-layout-height CSS variable defaults to 300px
        and is applied as INLINE styles on internal elements. Class-based !important
        cannot reliably override inline styles. Instead, we override the CSS variable
        itself at the root level, which Sandpack's inline styles will then read.
      */}
      <style>{`
        .sp-wrapper {
          --sp-layout-height: 100% !important;
          height: 100% !important;
        }
        .sp-layout {
          height: 100% !important;
          border: none !important;
          border-radius: 0 !important;
        }
        .sp-preview-container {
          height: 100% !important;
        }
        .sp-preview-iframe {
          height: 100% !important;
        }
      `}</style>

      {/* key forces a full iframe remount when Run is clicked */}
      <SandpackProvider
        key={`${refreshCount}-${activeTemplate}`}
        template={activeTemplate}
        files={files}
        theme={sandpackTheme}
        options={{
          recompileMode: 'delayed',
          recompileDelay: 500,
        }}
        customSetup={{ dependencies }}
      >
        <SandpackLayout style={{ height: '100%' }}>
          <SPPreview
            style={{ height: '100%', flex: 1 }}
            showNavigator={false}
            showRefreshButton={true}
            showOpenInCodeSandbox={false}
          />
        </SandpackLayout>

        {/* Render Console into the ResizablePanels bottom panel portal */}
        {consoleTarget && createPortal(
          <div style={{ height: '100%', overflow: 'auto', backgroundColor: '#09090b', padding: '8px' }}>
            <SandpackConsole style={{ height: '100%', border: 'none' }} showHeader={false} />
          </div>,
          consoleTarget
        )}
      </SandpackProvider>
    </div>
  );
}
