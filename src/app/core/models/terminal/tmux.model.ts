/**
 * Tmux Configuration Model
 */

export interface TmuxConfig {
  general: TmuxGeneral;
  appearance: TmuxAppearance;
  keybindings: TmuxKeybinding[];
  rawLines: string[]; // Preserve unrecognized lines
}

export interface TmuxGeneral {
  prefix: string;
  mouse: boolean;
  historyLimit: number;
  baseIndex: number;
  paneBaseIndex: number;
  renumberWindows: boolean;
  escapeTime: number;
  defaultTerminal: string;
}

export interface TmuxAppearance {
  statusPosition: 'top' | 'bottom';
  statusStyle: string;
  statusLeft: string;
  statusRight: string;
  statusLeftLength: number;
  statusRightLength: number;
  windowStatusFormat: string;
  windowStatusCurrentFormat: string;
}

export interface TmuxKeybinding {
  key: string;
  command: string;
  flags?: string; // -n for no prefix, -r for repeat
  description?: string;
}

// Common tmux commands
export const TMUX_COMMANDS = [
  'select-pane',
  'split-window',
  'select-window',
  'new-window',
  'kill-pane',
  'kill-window',
  'resize-pane',
  'swap-pane',
  'swap-window',
  'source-file',
  'display',
  'send-prefix',
] as const;

/**
 * Default Tmux configuration
 */
export function getDefaultTmuxConfig(): TmuxConfig {
  return {
    general: {
      prefix: 'C-a',
      mouse: true,
      historyLimit: 10000,
      baseIndex: 1,
      paneBaseIndex: 1,
      renumberWindows: true,
      escapeTime: 0,
      defaultTerminal: 'tmux-256color'
    },
    appearance: {
      statusPosition: 'bottom',
      statusStyle: 'bg=#1e1e2e fg=#cdd6f4',
      statusLeft: '#[fg=#89b4fa,bold] #S ',
      statusRight: '#[fg=#a6adc8] %H:%M ',
      statusLeftLength: 20,
      statusRightLength: 20,
      windowStatusFormat: '#[fg=#6c7086] #I:#W ',
      windowStatusCurrentFormat: '#[fg=#89b4fa,bold] #I:#W '
    },
    keybindings: [
      { key: '|', command: 'split-window -h -c "#{pane_current_path}"', description: 'Split horizontal' },
      { key: '-', command: 'split-window -v -c "#{pane_current_path}"', description: 'Split vertical' },
      { key: 'h', command: 'select-pane -L', description: 'Move left' },
      { key: 'j', command: 'select-pane -D', description: 'Move down' },
      { key: 'k', command: 'select-pane -U', description: 'Move up' },
      { key: 'l', command: 'select-pane -R', description: 'Move right' },
      { key: 'H', command: 'resize-pane -L 5', flags: '-r', description: 'Resize left' },
      { key: 'J', command: 'resize-pane -D 5', flags: '-r', description: 'Resize down' },
      { key: 'K', command: 'resize-pane -U 5', flags: '-r', description: 'Resize up' },
      { key: 'L', command: 'resize-pane -R 5', flags: '-r', description: 'Resize right' },
      { key: 'r', command: 'source-file ~/.tmux.conf \\; display "Config reloaded!"', description: 'Reload config' },
    ],
    rawLines: []
  };
}

/**
 * Parse tmux.conf content into TmuxConfig
 */
export function parseTmuxConfig(content: string): TmuxConfig {
  const config = getDefaultTmuxConfig();
  config.keybindings = [];

  const lines = content.split('\n');
  const rawLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse set commands
    if (trimmed.startsWith('set ') || trimmed.startsWith('set-option ')) {
      const setMatch = trimmed.match(/^set(?:-option)?\s+(-g\s+)?(-a\s+)?([^\s]+)\s+['"]?(.+?)['"]?$/);
      if (setMatch) {
        const key = setMatch[3];
        const value = setMatch[4];

        switch (key) {
          case 'prefix':
            config.general.prefix = value;
            break;
          case 'mouse':
            config.general.mouse = value === 'on';
            break;
          case 'history-limit':
            config.general.historyLimit = parseInt(value, 10) || 10000;
            break;
          case 'base-index':
            config.general.baseIndex = parseInt(value, 10) || 1;
            break;
          case 'renumber-windows':
            config.general.renumberWindows = value === 'on';
            break;
          case 'escape-time':
            config.general.escapeTime = parseInt(value, 10) || 0;
            break;
          case 'default-terminal':
            config.general.defaultTerminal = value;
            break;
          case 'status-position':
            config.appearance.statusPosition = value as 'top' | 'bottom';
            break;
          case 'status-style':
            config.appearance.statusStyle = value;
            break;
          case 'status-left':
            config.appearance.statusLeft = value;
            break;
          case 'status-right':
            config.appearance.statusRight = value;
            break;
          case 'status-left-length':
            config.appearance.statusLeftLength = parseInt(value, 10) || 20;
            break;
          case 'status-right-length':
            config.appearance.statusRightLength = parseInt(value, 10) || 20;
            break;
          default:
            rawLines.push(line);
        }
        continue;
      }
    }

    // Parse setw (set-window-option) commands
    if (trimmed.startsWith('setw ') || trimmed.startsWith('set-window-option ')) {
      const setwMatch = trimmed.match(/^setw?\s+(-g\s+)?([^\s]+)\s+['"]?(.+?)['"]?$/);
      if (setwMatch) {
        const key = setwMatch[2];
        const value = setwMatch[3];

        switch (key) {
          case 'pane-base-index':
            config.general.paneBaseIndex = parseInt(value, 10) || 1;
            break;
          case 'window-status-format':
            config.appearance.windowStatusFormat = value;
            break;
          case 'window-status-current-format':
            config.appearance.windowStatusCurrentFormat = value;
            break;
          default:
            rawLines.push(line);
        }
        continue;
      }
    }

    // Parse bind commands
    if (trimmed.startsWith('bind ') || trimmed.startsWith('bind-key ')) {
      const bindMatch = trimmed.match(/^bind(?:-key)?\s+(-[rn]\s+)?([^\s]+)\s+(.+)$/);
      if (bindMatch) {
        const flags = bindMatch[1]?.trim() || '';
        const key = bindMatch[2];
        const command = bindMatch[3];

        config.keybindings.push({
          key,
          command,
          flags: flags || undefined
        });
        continue;
      }
    }

    // Parse unbind commands (we track them but don't need special handling)
    if (trimmed.startsWith('unbind ')) {
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
 * Stringify TmuxConfig to tmux.conf format
 */
export function stringifyTmuxConfig(config: TmuxConfig): string {
  const lines: string[] = [
    '# Tmux Configuration',
    '# Managed by Argus',
    ''
  ];

  // Prefix key
  lines.push('# Prefix key');
  lines.push(`set -g prefix ${config.general.prefix}`);
  lines.push('unbind C-b');
  lines.push(`bind ${config.general.prefix} send-prefix`);
  lines.push('');

  // General settings
  lines.push('# General Settings');
  lines.push(`set -g mouse ${config.general.mouse ? 'on' : 'off'}`);
  lines.push(`set -g history-limit ${config.general.historyLimit}`);
  lines.push(`set -g base-index ${config.general.baseIndex}`);
  lines.push(`setw -g pane-base-index ${config.general.paneBaseIndex}`);
  lines.push(`set -g renumber-windows ${config.general.renumberWindows ? 'on' : 'off'}`);
  lines.push(`set -sg escape-time ${config.general.escapeTime}`);
  lines.push(`set -g default-terminal "${config.general.defaultTerminal}"`);
  lines.push('set -ag terminal-overrides ",xterm-256color:RGB"');
  lines.push('');

  // Status bar appearance
  lines.push('# Status Bar');
  lines.push(`set -g status-position ${config.appearance.statusPosition}`);
  lines.push(`set -g status-style '${config.appearance.statusStyle}'`);
  lines.push(`set -g status-left '${config.appearance.statusLeft}'`);
  lines.push(`set -g status-right '${config.appearance.statusRight}'`);
  lines.push(`set -g status-left-length ${config.appearance.statusLeftLength}`);
  lines.push(`set -g status-right-length ${config.appearance.statusRightLength}`);
  lines.push('');

  // Window status
  lines.push('# Window Status');
  lines.push(`setw -g window-status-format '${config.appearance.windowStatusFormat}'`);
  lines.push(`setw -g window-status-current-format '${config.appearance.windowStatusCurrentFormat}'`);
  lines.push('');

  // Keybindings
  if (config.keybindings.length > 0) {
    lines.push('# Keybindings');
    for (const kb of config.keybindings) {
      const flags = kb.flags ? `${kb.flags} ` : '';
      const comment = kb.description ? ` # ${kb.description}` : '';
      lines.push(`bind ${flags}${kb.key} ${kb.command}${comment}`);
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
