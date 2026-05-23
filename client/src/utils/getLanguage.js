/**
 * Maps file extension to Monaco editor language identifier.
 */
export function getLanguage(path = '') {
  const ext = path.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    py: 'python',
    sh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    env: 'plaintext',
    txt: 'plaintext',
  };
  return map[ext] || 'plaintext';
}
