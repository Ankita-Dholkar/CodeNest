/**
 * Returns the filename from a full path.
 * e.g. "/src/components/App.jsx" → "App.jsx"
 */
export const getFilename = (path = '') => path.split('/').filter(Boolean).pop() || '';

/**
 * Returns the parent directory of a path.
 * e.g. "/src/components/App.jsx" → "/src/components"
 */
export const getDirname = (path = '') => {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
};

/**
 * Joins path segments safely.
 * e.g. joinPath('/src', 'utils', 'helper.js') → "/src/utils/helper.js"
 */
export const joinPath = (...parts) =>
  '/' + parts.flatMap((p) => p.split('/')).filter(Boolean).join('/');

/**
 * Returns whether a path represents a directory placeholder (.gitkeep).
 */
export const isGitKeep = (path = '') => path.endsWith('.gitkeep');
