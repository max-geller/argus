/**
 * Zsh Configuration Model
 */

export interface ZshConfig {
  environment: EnvironmentVar[];
  history: ZshHistory;
  options: string[];
  plugins: ZshPlugin[];
  aliases: ShellAlias[];
  keybindings: ZshKeybinding[];
  autosuggestions: ZshAutosuggestions;
  syntaxHighlighting: Record<string, string>;
  startupCommands: string[];
  rawLines: string[]; // Preserve unrecognized lines
}

export interface EnvironmentVar {
  key: string;
  value: string;
  export: boolean;
}

export interface ZshHistory {
  file: string;
  size: number;
  saveSize: number;
  options: string[];
}

export interface ZshPlugin {
  name: string;
  path: string;
  enabled: boolean;
}

export interface ShellAlias {
  name: string;
  command: string;
  description?: string;
}

export interface ZshKeybinding {
  key: string;
  widget: string;
  description?: string;
}

export interface ZshAutosuggestions {
  strategy: string[];
  highlightStyle: string;
  bufferMaxSize: number;
}

// Common zsh options (setopt)
export const ZSH_OPTIONS = [
  'AUTO_CD',
  'AUTO_PUSHD',
  'PUSHD_IGNORE_DUPS',
  'PUSHD_SILENT',
  'CORRECT',
  'CORRECT_ALL',
  'INTERACTIVE_COMMENTS',
  'EXTENDED_GLOB',
  'NOMATCH',
  'NOTIFY',
  'PROMPT_SUBST',
  'SHARE_HISTORY',
  'APPEND_HISTORY',
  'INC_APPEND_HISTORY',
  'HIST_IGNORE_DUPS',
  'HIST_IGNORE_ALL_DUPS',
  'HIST_IGNORE_SPACE',
  'HIST_FIND_NO_DUPS',
  'HIST_REDUCE_BLANKS',
  'HIST_VERIFY',
  'HIST_EXPIRE_DUPS_FIRST',
] as const;

/**
 * Default Zsh configuration
 */
export function getDefaultZshConfig(): ZshConfig {
  return {
    environment: [],
    history: {
      file: '~/.zsh_history',
      size: 10000,
      saveSize: 10000,
      options: ['SHARE_HISTORY', 'HIST_IGNORE_DUPS', 'HIST_IGNORE_SPACE']
    },
    options: ['AUTO_CD', 'INTERACTIVE_COMMENTS', 'CORRECT'],
    plugins: [],
    aliases: [
      { name: 'ls', command: 'ls --color=auto' },
      { name: 'll', command: 'ls -la' },
      { name: 'la', command: 'ls -A' },
      { name: 'grep', command: 'grep --color=auto' }
    ],
    keybindings: [],
    autosuggestions: {
      strategy: ['history', 'completion'],
      highlightStyle: 'fg=#666666',
      bufferMaxSize: 20
    },
    syntaxHighlighting: {},
    startupCommands: [],
    rawLines: []
  };
}

/**
 * Parse .zshrc content into ZshConfig
 */
export function parseZshConfig(content: string): ZshConfig {
  const config = getDefaultZshConfig();
  config.aliases = []; // Clear defaults, parse from file
  config.environment = [];
  config.plugins = [];
  config.keybindings = [];
  config.options = [];
  config.startupCommands = [];

  const lines = content.split('\n');
  const rawLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (but preserve them in raw if in a block)
    if (!trimmed) continue;

    // Skip comments (preserve them in startupCommands if they look like section headers)
    if (trimmed.startsWith('#')) {
      continue;
    }

    // Export statements
    if (trimmed.startsWith('export ')) {
      const match = trimmed.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match) {
        let value = match[2];
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        config.environment.push({
          key: match[1],
          value: value,
          export: true
        });
        continue;
      }
    }

    // Variable assignments without export
    const varMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (varMatch && !trimmed.includes('(') && !trimmed.includes('$')) {
      // Check if it's a known variable
      const key = varMatch[1];
      let value = varMatch[2];
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key === 'HISTFILE') {
        config.history.file = value;
        continue;
      } else if (key === 'HISTSIZE') {
        config.history.size = parseInt(value, 10) || 10000;
        continue;
      } else if (key === 'SAVEHIST') {
        config.history.saveSize = parseInt(value, 10) || 10000;
        continue;
      }
    }

    // setopt
    if (trimmed.startsWith('setopt ')) {
      const opts = trimmed.substring(7).trim().split(/\s+/);
      config.options.push(...opts);
      continue;
    }

    // unsetopt (we track these as negative)
    if (trimmed.startsWith('unsetopt ')) {
      continue; // Skip for now
    }

    // Aliases
    if (trimmed.startsWith('alias ')) {
      const match = trimmed.match(/^alias\s+([^=]+)=['"]?(.+?)['"]?$/);
      if (match) {
        config.aliases.push({
          name: match[1].trim(),
          command: match[2]
        });
      }
      continue;
    }

    // Keybindings
    if (trimmed.startsWith('bindkey ')) {
      const match = trimmed.match(/^bindkey\s+['"]([^'"]+)['"]\s+(.+)$/);
      if (match) {
        config.keybindings.push({
          key: match[1],
          widget: match[2]
        });
      }
      continue;
    }

    // Source statements (plugins)
    if (trimmed.startsWith('source ') || trimmed.startsWith('. ')) {
      const path = trimmed.replace(/^(source|\.) /, '').trim();
      // Determine plugin name from path
      let name = 'unknown';
      if (path.includes('zsh-autosuggestions')) {
        name = 'zsh-autosuggestions';
      } else if (path.includes('zsh-syntax-highlighting')) {
        name = 'zsh-syntax-highlighting';
      } else if (path.includes('zsh-completions')) {
        name = 'zsh-completions';
      } else {
        // Use filename
        const parts = path.split('/');
        name = parts[parts.length - 1].replace('.zsh', '');
      }
      config.plugins.push({
        name,
        path,
        enabled: true
      });
      continue;
    }

    // ZSH_AUTOSUGGEST settings
    if (trimmed.startsWith('ZSH_AUTOSUGGEST_')) {
      const match = trimmed.match(/^(ZSH_AUTOSUGGEST_[A-Z_]+)=(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2];
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        if (key === 'ZSH_AUTOSUGGEST_STRATEGY') {
          // Parse array: (history completion)
          const strategies = value.replace(/[()]/g, '').split(/\s+/);
          config.autosuggestions.strategy = strategies;
        } else if (key === 'ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE') {
          config.autosuggestions.highlightStyle = value;
        } else if (key === 'ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE') {
          config.autosuggestions.bufferMaxSize = parseInt(value, 10) || 20;
        }
      }
      continue;
    }

    // ZSH_HIGHLIGHT settings
    if (trimmed.startsWith('ZSH_HIGHLIGHT_STYLES')) {
      const match = trimmed.match(/^ZSH_HIGHLIGHT_STYLES\[([^\]]+)\]=(.*)$/);
      if (match) {
        let value = match[2];
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        config.syntaxHighlighting[match[1]] = value;
      }
      continue;
    }

    // eval statements (starship, zoxide, etc.)
    if (trimmed.startsWith('eval ')) {
      config.startupCommands.push(trimmed);
      continue;
    }

    // Preserve other lines
    rawLines.push(line);
  }

  config.rawLines = rawLines;
  return config;
}

/**
 * Stringify ZshConfig to .zshrc format
 */
export function stringifyZshConfig(config: ZshConfig): string {
  const lines: string[] = [
    '# Zsh Configuration',
    '# Managed by Argus',
    ''
  ];

  // History settings
  lines.push('# History');
  lines.push(`HISTFILE=${config.history.file}`);
  lines.push(`HISTSIZE=${config.history.size}`);
  lines.push(`SAVEHIST=${config.history.saveSize}`);
  for (const opt of config.history.options) {
    lines.push(`setopt ${opt}`);
  }
  lines.push('');

  // Shell options
  if (config.options.length > 0) {
    lines.push('# Shell Options');
    for (const opt of config.options) {
      lines.push(`setopt ${opt}`);
    }
    lines.push('');
  }

  // Environment variables
  if (config.environment.length > 0) {
    lines.push('# Environment Variables');
    for (const env of config.environment) {
      if (env.export) {
        lines.push(`export ${env.key}="${env.value}"`);
      } else {
        lines.push(`${env.key}="${env.value}"`);
      }
    }
    lines.push('');
  }

  // Keybindings
  if (config.keybindings.length > 0) {
    lines.push('# Key Bindings');
    for (const kb of config.keybindings) {
      lines.push(`bindkey '${kb.key}' ${kb.widget}`);
    }
    lines.push('');
  }

  // Aliases
  if (config.aliases.length > 0) {
    lines.push('# Aliases');
    for (const alias of config.aliases) {
      lines.push(`alias ${alias.name}='${alias.command}'`);
    }
    lines.push('');
  }

  // Autosuggestions config
  if (config.autosuggestions.strategy.length > 0) {
    lines.push('# Zsh Autosuggestions');
    lines.push(`ZSH_AUTOSUGGEST_STRATEGY=(${config.autosuggestions.strategy.join(' ')})`);
    lines.push(`ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="${config.autosuggestions.highlightStyle}"`);
    lines.push(`ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=${config.autosuggestions.bufferMaxSize}`);
    lines.push('');
  }

  // Syntax highlighting styles
  if (Object.keys(config.syntaxHighlighting).length > 0) {
    lines.push('# Syntax Highlighting');
    for (const [token, style] of Object.entries(config.syntaxHighlighting)) {
      lines.push(`ZSH_HIGHLIGHT_STYLES[${token}]="${style}"`);
    }
    lines.push('');
  }

  // Plugins (source statements)
  if (config.plugins.length > 0) {
    lines.push('# Plugins');
    for (const plugin of config.plugins) {
      if (plugin.enabled) {
        lines.push(`source ${plugin.path}`);
      }
    }
    lines.push('');
  }

  // Startup commands (eval statements)
  if (config.startupCommands.length > 0) {
    lines.push('# Startup Commands');
    for (const cmd of config.startupCommands) {
      lines.push(cmd);
    }
    lines.push('');
  }

  // Preserved raw lines
  if (config.rawLines.length > 0) {
    lines.push('# Additional Configuration');
    lines.push(...config.rawLines);
    lines.push('');
  }

  return lines.join('\n');
}
