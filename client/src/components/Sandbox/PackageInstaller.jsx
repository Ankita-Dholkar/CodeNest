import { useState } from 'react';
import { Package, X, Plus, Check, Loader2 } from 'lucide-react';
import { useFileStore } from '../../store/useFileStore';

/**
 * PackageInstaller — adds npm packages to the Sandpack environment
 * by injecting/updating package.json in the virtual file system.
 */
export default function PackageInstaller({ onClose }) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const { files, updateFileContent, createFile } = useFileStore();

  const handleInstall = async (e) => {
    e.preventDefault();
    const pkg = input.trim();
    if (!pkg) return;

    setStatus('loading');

    try {
      // Resolve the latest version from npm registry
      const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
      if (!res.ok) throw new Error(`Package "${pkg}" not found on npm`);
      const { version } = await res.json();

      // Read or create package.json in the Sandpack virtual FS
      const pkgPath = '/package.json';
      let pkgJson = {
        name: 'sandbox',
        version: '1.0.0',
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      };

      if (files[pkgPath]?.content) {
        try { pkgJson = JSON.parse(files[pkgPath].content); } catch (_) {}
      }

      pkgJson.dependencies = {
        ...(pkgJson.dependencies || {}),
        [pkg]: `^${version}`,
      };

      const newContent = JSON.stringify(pkgJson, null, 2);

      if (files[pkgPath]) {
        updateFileContent(pkgPath, newContent);
      } else {
        createFile(pkgPath, newContent, 'json', null);
      }

      setStatus('success');
      setMessage(`Installed ${pkg}@^${version}`);
      setInput('');
      setTimeout(() => setStatus(null), 2500);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-background)',
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}>
          <Package style={{ width: '12px', height: '12px' }} />
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#71717a' }}>
            Install npm package
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
          onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
        >
          <X style={{ width: '12px', height: '12px' }} />
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleInstall} style={{ display: 'flex', gap: '6px' }}>
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. lodash, axios, dayjs"
          style={{
            flex: 1,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#e4e4e7',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#8b5cf6'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !input.trim()}
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: (!input.trim() || status === 'loading') ? 0.5 : 1,
          }}
        >
          {status === 'loading'
            ? <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
            : <Plus style={{ width: '12px', height: '12px' }} />}
          Add
        </button>
      </form>

      {/* Status message */}
      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4ade80' }}>
          <Check style={{ width: '11px', height: '11px' }} />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div style={{ fontSize: '11px', color: '#f87171' }}>⚠ {message}</div>
      )}
    </div>
  );
}
