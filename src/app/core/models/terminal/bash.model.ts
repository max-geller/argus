/**
 * Bash Configuration Model
 */

export interface BashConfig {
  environment: EnvironmentVar[];
  aliases: ShellAlias[];
  sources: string[];
  pathAdditions: string[];
  historySettings: BashHistory;
  shopOptions: string[];
  startupCommands: string[];
  rawLines: string[]; // Preserve unrecognized lines
}

export interface EnvironmentVar {
  key: string;
  value: string;
  export: boolean;
}

export interface ShellAlias {
  name: string;
  command: string;
  description?: string;
}

export interface BashHistory {
  histControl: string;
  histSize: number;
  histFileSize: number;
  histIgnore: string;
}

// Common shopt options
export const BASH_SHOPT_OPTIONS = [
  'histappend',
  'checkwinsize',
  'autocd',
  'cdspell',
  'dirspell',
  'dotglob',
  'extglob',
  'globstar',
  'nocaseglob',
  'nocasematch',
] as const;

/**
 * Default Bash configuration
 */
export function getDefaultBashConfig(): BashConfig {
  return {
    environment: [],
    aliases: [
      { name: 'ls', command: 'ls --color=auto' },
      { name: 'll', command: 'ls -la' },
      { name: 'la', command: 'ls -A' },
      { name: 'grep', command: 'grep --color=auto' },
      { name: 'fgrep', command: 'fgrep --color=auto' },
      { name: 'egrep', command: 'egrep --color=auto' }
    ],
    sources: [],
    pathAdditions: [],
    historySettings: {
      histControl: 'ignoreboth',
      histSize: 1000,
      histFileSize: 2000,
      histIgnore: ''
    },
    shopOptions: ['histappend', 'checkwinsize'],
    startupCommands: [],
    rawLines: []
  };
}

/**
 * Parse .bashrc content into BashConfig
 */
export function parseBashConfig(content: string): BashConfig {
  const config = getDefaultBashConfig();
  config.aliases = [];
  config.environment = [];
  config.sources = [];
  config.pathAdditions = [];
  config.shopOptions = [];
  config.startupCommands = [];

  const lines = content.split('\n');
  const rawLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip comments
    if (trimmed.startsWith('#')) continue;

    // Handle case statement for non-interactive check
    if (trimmed.startsWith('case ') || trimmed === 'esac' || trimmed === '*) return;;') {
      rawLines.push(line);
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

        // Check for PATH additions
        if (match[1] === 'PATH' && value.includes('$PATH')) {
          const additions = value.split(':').filter(p => p !== '$PATH' && p.trim());
          config.pathAdditions.push(...additions);
        } else {
          config.environment.push({
            key: match[1],
            value: value,
            export: true
          });
        }
        continue;
      }
    }

    // Variable assignments
    const varMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (varMatch && !trimmed.includes('(') && !trimmed.startsWith('alias')) {
      const key = varMatch[1];
      let value = varMatch[2];
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      switch (key) {
        case 'HISTCONTROL':
          config.historySettings.histControl = value;
          continue;
        case 'HISTSIZE':
          config.historySettings.histSize = parseInt(value, 10) || 1000;
          continue;
        case 'HISTFILESIZE':
          config.historySettings.histFileSize = parseInt(value, 10) || 2000;
          continue;
        case 'HISTIGNORE':
          config.historySettings.histIgnore = value;
          continue;
      }
    }

    // shopt options
    if (trimmed.startsWith('shopt -s ')) {
      const opts = trimmed.substring(9).trim().split(/\s+/);
      config.shopOptions.push(...opts);
      continue;
    }

    // Aliases
    if (trimmed.startsWith('alias ')) {
      const match = trimmed.match(/^alias\s+([^=]+)=['"](.+?)['"]$/);
      if (match) {
        config.aliases.push({
          name: match[1].trim(),
          command: match[2]
        });
      }
      continue;
    }

    // Source statements
    if (trimmed.startsWith('source ') || trimmed.startsWith('. ')) {
      const path = trimmed.replace(/^(source|\.) /, '').replace(/['"`]/g, '').trim();
      config.sources.push(path);
      continue;
    }

    // eval statements (starship, etc.)
    if (trimmed.startsWith('eval ')) {
      config.startupCommands.push(trimmed);
      continue;
    }

    // Lesspipe check (common in Fedora/Ubuntu bashrc)
    if (trimmed.includes('lesspipe')) {
      config.startupCommands.push(trimmed);
      continue;
    }

    // If/for/while blocks - preserve as raw
    if (trimmed.startsWith('if ') || trimmed.startsWith('for ') ||
        trimmed.startsWith('while ') || trimmed === 'fi' ||
        trimmed === 'done' || trimmed === 'then' || trimmed === 'do') {
      rawLines.push(line);
      continue;
    }

    // Preserve other lines
    rawLines.push(line);
  }

  config.rawLines = rawLines;
  return config;
}

/**
 * Stringify BashConfig to .bashrc format
 */
export function stringifyBashConfig(config: BashConfig): string {
  const lines: string[] = [
    '# Bash Configuration',
    '# Managed by Argus',
    '',
    '# If not running interactively, don\'t do anything',
    'case $- in',
    '    *i*) ;;',
    '      *) return;;',
    'esac',
    ''
  ];

  // History settings
  lines.push('# History');
  lines.push(`HISTCONTROL=${config.historySettings.histControl}`);
  lines.push(`HISTSIZE=${config.historySettings.histSize}`);
  lines.push(`HISTFILESIZE=${config.historySettings.histFileSize}`);
  if (config.historySettings.histIgnore) {
    lines.push(`HISTIGNORE="${config.historySettings.histIgnore}"`);
  }
  lines.push('');

  // Shopt options
  if (config.shopOptions.length > 0) {
    lines.push('# Shell Options');
    for (const opt of config.shopOptions) {
      lines.push(`shopt -s ${opt}`);
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

  // PATH additions
  if (config.pathAdditions.length > 0) {
    lines.push('# PATH Additions');
    const pathStr = config.pathAdditions.join(':') + ':$PATH';
    lines.push(`export PATH="${pathStr}"`);
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

  // Source statements
  if (config.sources.length > 0) {
    lines.push('# Sourced Files');
    for (const src of config.sources) {
      // Handle conditional sources
      if (src.includes('$')) {
        lines.push(`[ -f "${src}" ] && . "${src}"`);
      } else {
        lines.push(`source "${src}"`);
      }
    }
    lines.push('');
  }

  // Startup commands
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
