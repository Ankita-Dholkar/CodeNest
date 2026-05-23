import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, X, Minus } from 'lucide-react';

const PROMPT = '\r\n\x1b[38;5;141m❯\x1b[0m ';
const WELCOME =
  '\x1b[1;38;5;141m  CodeNest Terminal\x1b[0m\r\n' +
  '\x1b[38;5;243m  Connected to sandbox environment\x1b[0m\r\n' +
  '\x1b[38;5;243m  ─────────────────────────────────\x1b[0m\r\n';

export default function Terminal({ onClose, onMinimize }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const inputRef = useRef('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let term, fitAddon;

    async function initTerminal() {
      // Dynamic import so xterm CSS & module load only when terminal is open
      const [{ Terminal: XTerm }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
        import('@xterm/addon-web-links'),
      ]);

      // Import xterm CSS
      await import('@xterm/xterm/css/xterm.css');

      term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 12.5,
        lineHeight: 1.5,
        theme: {
          background: '#09090b',
          foreground: '#abb2bf',
          cursor: '#8b5cf6',
          cursorAccent: '#09090b',
          black: '#1e1e2e',
          red: '#f38ba8',
          green: '#a6e3a1',
          yellow: '#f9e2af',
          blue: '#89b4fa',
          magenta: '#cba6f7',
          cyan: '#89dceb',
          white: '#cdd6f4',
          brightBlack: '#45475a',
          brightRed: '#f38ba8',
          brightGreen: '#a6e3a1',
          brightYellow: '#f9e2af',
          brightBlue: '#89b4fa',
          brightMagenta: '#cba6f7',
          brightCyan: '#89dceb',
          brightWhite: '#cdd6f4',
          selectionBackground: 'rgba(139,92,246,0.3)',
        },
        scrollback: 1000,
        allowTransparency: true,
      });

      fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      term.open(containerRef.current);
      fitAddon.fit();

      termRef.current = term;
      fitRef.current = fitAddon;

      // Welcome message
      term.write(WELCOME + PROMPT);
      setReady(true);

      // Handle user input
      term.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.key === 'Enter') {
          const cmd = inputRef.current.trim();
          term.write('\r\n');
          handleCommand(term, cmd);
          inputRef.current = '';
          term.write(PROMPT);
        } else if (domEvent.key === 'Backspace') {
          if (inputRef.current.length > 0) {
            inputRef.current = inputRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (printable) {
          inputRef.current += key;
          term.write(key);
        }
      });
    }

    if (containerRef.current) initTerminal();

    return () => {
      term?.dispose();
    };
  }, []);

  // Attach resize observer after ready
  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const ro = new ResizeObserver(() => fitRef.current?.fit());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [ready]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#09090b' }}>
      {/* Terminal header bar */}
      <div
        className="h-8 flex items-center justify-between px-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
          <span className="text-[11px] font-mono" style={{ color: '#71717a' }}>
            terminal
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1 rounded transition-colors"
            style={{ color: '#52525b' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: '#52525b' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* xterm.js container */}
      <div ref={containerRef} className="flex-1 overflow-hidden p-2" />
    </div>
  );
}

// ── Store-aware Virtual Shell ──────────────────────────────────────────────────
import { useFileStore } from '../../store/useFileStore';
import { useProjectStore } from '../../store/useProjectStore';

function handleCommand(term, cmd) {
  if (!cmd) return;
  const args = cmd.split(' ').filter(Boolean);
  const command = args[0];

  const files = useFileStore.getState().files;
  const addFileLocally = useFileStore.getState().createFile;
  const deleteFileLocally = useFileStore.getState().deleteFile;
  const incrementRefresh = useProjectStore.getState().incrementRefresh;

  switch (command) {
    case 'help':
      term.write(
        '\x1b[38;5;243m  Available commands:\x1b[0m\r\n' +
        '  \x1b[38;5;141mhelp\x1b[0m       — show this message\r\n' +
        '  \x1b[38;5;141mclear\x1b[0m      — clear terminal\r\n' +
        '  \x1b[38;5;141mls\x1b[0m         — list files in sandbox\r\n' +
        '  \x1b[38;5;141mcat\x1b[0m <file> — read file content\r\n' +
        '  \x1b[38;5;141mtouch\x1b[0m <f>  — create new file\r\n' +
        '  \x1b[38;5;141mrm\x1b[0m <file>  — delete file\r\n' +
        '  \x1b[38;5;141mnpm\x1b[0m start  — start the development server\r\n' +
        '  \x1b[38;5;141mnode\x1b[0m <f>   — run a node script\r\n'
      );
      break;
    case 'clear':
      term.clear();
      break;
    case 'ls': {
      const paths = Object.keys(files).filter(p => !p.endsWith('.gitkeep')).map(p => p.slice(1));
      if (paths.length === 0) {
        term.write(' \r\n');
      } else {
        term.write(`\x1b[38;5;141m${paths.join('  ')}\x1b[0m\r\n`);
      }
      break;
    }
    case 'cat': {
      const target = args[1] ? `/${args[1]}` : null;
      if (!target) {
        term.write('cat: missing operand\r\n');
        break;
      }
      if (!files[target]) {
        term.write(`cat: ${args[1]}: No such file or directory\r\n`);
        break;
      }
      term.write(`${files[target].content.replace(/\n/g, '\r\n')}\r\n`);
      break;
    }
    case 'touch': {
      const target = args[1];
      if (!target) {
        term.write('touch: missing operand\r\n');
        break;
      }
      if (!files[`/${target}`]) {
        // Just create it locally for the illusion (real save happens via UI)
        addFileLocally(`/${target}`, '', 'javascript', null);
      }
      break;
    }
    case 'rm': {
      const target = args[1];
      if (!target) {
        term.write('rm: missing operand\r\n');
        break;
      }
      if (!files[`/${target}`]) {
        term.write(`rm: ${target}: No such file or directory\r\n`);
        break;
      }
      // Note: only deletes locally. Real delete happens via the sidebar context menu
      deleteFileLocally(`/${target}`);
      break;
    }
    case 'pwd':
      term.write('/sandbox\r\n');
      break;
    case 'echo':
      term.write(args.slice(1).join(' ') + '\r\n');
      break;
    case 'node':
    case 'npm':
    case 'yarn':
    case 'pnpm': {
      // The illusion of execution: Sandpack is actually running it.
      // We just trigger a Sandpack reboot to make it feel responsive.
      const isStart = command === 'node' || args.includes('start') || args.includes('dev');
      
      term.write(`\x1b[38;5;243m> code-nest@1.0.0 ${args.join(' ')}\x1b[0m\r\n`);
      term.write('\x1b[38;5;141mStarting compilation...\x1b[0m\r\n');
      
      incrementRefresh(); // <--- Reboots the live preview!

      setTimeout(() => {
        term.write('\x1b[38;5;120m✔ Compiled successfully!\x1b[0m\r\n');
        if (isStart) {
          term.write('\r\n\x1b[38;5;243m  Local: \x1b[38;5;141mhttp://localhost:3000\x1b[0m\r\n');
        }
        term.write(PROMPT);
      }, 800);
      return; // Return early so we don't print the PROMPT immediately
    }
    default:
      term.write(
        `\x1b[38;5;203mcommand not found:\x1b[0m ${command}\r\n` +
        '\x1b[38;5;243m  Type \x1b[38;5;141mhelp\x1b[38;5;243m for available commands\x1b[0m\r\n'
      );
  }
}
