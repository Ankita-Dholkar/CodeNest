/**
 * Shared file-extension → icon/color map.
 * Used by FileTree and EditorTabs to keep icons consistent.
 */
export const FILE_ICONS = {
  jsx:  { icon: '⚛',  color: '#60a5fa' },
  tsx:  { icon: '⚛',  color: '#60a5fa' },
  js:   { icon: 'JS', color: '#facc15' },
  ts:   { icon: 'TS', color: '#93c5fd' },
  css:  { icon: '#',  color: '#f472b6' },
  scss: { icon: '#',  color: '#f472b6' },
  html: { icon: '<>', color: '#fb923c' },
  json: { icon: '{}', color: '#fde047' },
  md:   { icon: 'M',  color: '#9ca3af' },
  py:   { icon: 'PY', color: '#4ade80' },
  sh:   { icon: '$',  color: '#34d399' },
  yaml: { icon: 'Y',  color: '#fb923c' },
  yml:  { icon: 'Y',  color: '#fb923c' },
};

/** Returns the icon/color pair for a given file path or name. */
export function getFileIcon(pathOrName = '') {
  const ext = pathOrName.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: '•', color: '#6b7280' };
}
