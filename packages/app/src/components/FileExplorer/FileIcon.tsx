export interface FileIconProps {
  type: 'file' | 'directory';
  name: string;
}

/**
 * FileIcon component - Displays appropriate icon for file type
 *
 * Supports common file extensions:
 * - TypeScript/JavaScript (.ts, .tsx, .js, .jsx)
 * - Python (.py)
 * - Markdown (.md)
 * - JSON (.json)
 * - YAML (.yaml, .yml)
 * - Config files
 * - And more...
 */
export function FileIcon({ type, name }: FileIconProps) {
  if (type === 'directory') {
    return <span className="file-icon directory-icon">📁</span>;
  }

  // Get file extension
  const ext = name.split('.').pop()?.toLowerCase() || '';

  // Map extensions to icons
  const iconMap: Record<string, string> = {
    // Programming languages
    ts: '🔷',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    py: '🐍',
    java: '☕',
    cpp: '🔧',
    c: '🔧',
    go: '🐹',
    rs: '🦀',
    rb: '💎',
    php: '🐘',

    // Markup and data
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    json: '📦',
    xml: '📄',
    yaml: '⚙️',
    yml: '⚙️',
    toml: '⚙️',

    // Documentation
    md: '📝',
    mdx: '📝',
    txt: '📄',
    pdf: '📕',

    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🎨',
    ico: '🖼️',

    // Config files
    env: '🔐',
    gitignore: '🚫',
    dockerignore: '🐳',
    eslintrc: '✅',
    prettierrc: '✨',
    babelrc: '🔄',

    // Build/Package files
    lock: '🔒',
    package: '📦',
    dockerfile: '🐳',
    makefile: '🔨',

    // Shell scripts
    sh: '🐚',
    bash: '🐚',
    zsh: '🐚',
    ps1: '💻',

    // Database
    sql: '🗄️',
    db: '🗄️',
    sqlite: '🗄️',
  };

  // Special filenames
  const specialFiles: Record<string, string> = {
    'package.json': '📦',
    'tsconfig.json': '🔷',
    'readme.md': '📖',
    'license': '📜',
    'dockerfile': '🐳',
    'makefile': '🔨',
    '.gitignore': '🚫',
    '.env': '🔐',
  };

  const lowerName = name.toLowerCase();
  if (specialFiles[lowerName]) {
    return <span className="file-icon">{specialFiles[lowerName]}</span>;
  }

  const icon = iconMap[ext] || '📄';
  return <span className="file-icon">{icon}</span>;
}
