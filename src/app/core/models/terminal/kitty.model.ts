/**
 * Kitty Terminal Configuration Model
 */

export interface KittyConfig {
  font: KittyFont;
  appearance: KittyAppearance;
  window: KittyWindow;
  tabBar: KittyTabBar;
  behavior: KittyBehavior;
  keybindings: KittyKeybinding[];
  theme: KittyTheme;
  rawLines: string[]; // Preserve unrecognized lines
}

export interface KittyFont {
  family: string;
  size: number;
  bold: string;
  italic: string;
  boldItalic: string;
}

export interface KittyAppearance {
  backgroundOpacity: number;
  cursorShape: 'block' | 'beam' | 'underline';
  cursorBlink: boolean;
  cursorBlinkInterval: number;
}

export interface KittyWindow {
  initialWidth: string;
  initialHeight: string;
  paddingWidth: number;
  marginWidth: number;
  borderWidth: number;
  rememberSize: boolean;
}

export interface KittyTabBar {
  style: 'fade' | 'slant' | 'separator' | 'powerline' | 'hidden';
  edge: 'top' | 'bottom';
}

export interface KittyBehavior {
  shell: string;
  scrollbackLines: number;
  copyOnSelect: boolean | string;
  enableAudioBell: boolean;
}

export interface KittyKeybinding {
  key: string;
  action: string;
  mods?: string;
}

export interface KittyTheme {
  includeFile: string;
}

/**
 * Default Kitty configuration
 */
export function getDefaultKittyConfig(): KittyConfig {
  return {
    font: {
      family: 'JetBrains Mono Nerd Font',
      size: 12.0,
      bold: 'auto',
      italic: 'auto',
      boldItalic: 'auto'
    },
    appearance: {
      backgroundOpacity: 1.0,
      cursorShape: 'beam',
      cursorBlink: true,
      cursorBlinkInterval: 0.5
    },
    window: {
      initialWidth: '120c',
      initialHeight: '40c',
      paddingWidth: 8,
      marginWidth: 0,
      borderWidth: 0,
      rememberSize: true
    },
    tabBar: {
      style: 'powerline',
      edge: 'bottom'
    },
    behavior: {
      shell: '.',
      scrollbackLines: 10000,
      copyOnSelect: 'clipboard',
      enableAudioBell: false
    },
    keybindings: [],
    theme: {
      includeFile: ''
    },
    rawLines: []
  };
}

/**
 * Parse kitty.conf content into KittyConfig
 */
export function parseKittyConfig(content: string): KittyConfig {
  const config = getDefaultKittyConfig();
  const lines = content.split('\n');
  const rawLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse key-value pairs
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) continue;

    const key = trimmed.substring(0, spaceIndex).trim();
    const value = trimmed.substring(spaceIndex + 1).trim();

    switch (key) {
      // Font settings
      case 'font_family':
        config.font.family = value;
        break;
      case 'font_size':
        config.font.size = parseFloat(value);
        break;
      case 'bold_font':
        config.font.bold = value;
        break;
      case 'italic_font':
        config.font.italic = value;
        break;
      case 'bold_italic_font':
        config.font.boldItalic = value;
        break;

      // Appearance
      case 'background_opacity':
        config.appearance.backgroundOpacity = parseFloat(value);
        break;
      case 'cursor_shape':
        config.appearance.cursorShape = value as KittyAppearance['cursorShape'];
        break;
      case 'cursor_blink_interval':
        config.appearance.cursorBlinkInterval = parseFloat(value);
        config.appearance.cursorBlink = parseFloat(value) > 0;
        break;

      // Window
      case 'initial_window_width':
        config.window.initialWidth = value;
        break;
      case 'initial_window_height':
        config.window.initialHeight = value;
        break;
      case 'window_padding_width':
        config.window.paddingWidth = parseInt(value, 10);
        break;
      case 'window_margin_width':
        config.window.marginWidth = parseInt(value, 10);
        break;
      case 'window_border_width':
        config.window.borderWidth = parseInt(value, 10);
        break;
      case 'remember_window_size':
        config.window.rememberSize = value === 'yes';
        break;

      // Tab bar
      case 'tab_bar_style':
        config.tabBar.style = value as KittyTabBar['style'];
        break;
      case 'tab_bar_edge':
        config.tabBar.edge = value as KittyTabBar['edge'];
        break;

      // Behavior
      case 'shell':
        config.behavior.shell = value;
        break;
      case 'scrollback_lines':
        config.behavior.scrollbackLines = parseInt(value, 10);
        break;
      case 'copy_on_select':
        config.behavior.copyOnSelect = value === 'yes' || value === 'clipboard' ? value : false;
        break;
      case 'enable_audio_bell':
        config.behavior.enableAudioBell = value === 'yes';
        break;

      // Keybindings (map command)
      case 'map':
        const parts = value.split(/\s+/);
        if (parts.length >= 2) {
          config.keybindings.push({
            key: parts[0],
            action: parts.slice(1).join(' ')
          });
        }
        break;

      // Theme
      case 'include':
        config.theme.includeFile = value;
        break;

      default:
        // Preserve unrecognized lines
        rawLines.push(line);
    }
  }

  config.rawLines = rawLines;
  return config;
}

/**
 * Stringify KittyConfig to kitty.conf format
 */
export function stringifyKittyConfig(config: KittyConfig): string {
  const lines: string[] = [
    '# Kitty Terminal Configuration',
    '# Managed by Argus',
    '',
    '# Font',
    `font_family      ${config.font.family}`,
    `bold_font        ${config.font.bold}`,
    `italic_font      ${config.font.italic}`,
    `bold_italic_font ${config.font.boldItalic}`,
    `font_size        ${config.font.size}`,
    '',
    '# Cursor',
    `cursor_shape ${config.appearance.cursorShape}`,
    `cursor_blink_interval ${config.appearance.cursorBlink ? config.appearance.cursorBlinkInterval : 0}`,
    '',
    '# Appearance',
    `background_opacity ${config.appearance.backgroundOpacity}`,
    '',
    '# Scrollback',
    `scrollback_lines ${config.behavior.scrollbackLines}`,
    '',
    '# Mouse',
    `copy_on_select ${typeof config.behavior.copyOnSelect === 'boolean' ? (config.behavior.copyOnSelect ? 'yes' : 'no') : config.behavior.copyOnSelect}`,
    '',
    '# Window',
    `remember_window_size  ${config.window.rememberSize ? 'yes' : 'no'}`,
    `initial_window_width  ${config.window.initialWidth}`,
    `initial_window_height ${config.window.initialHeight}`,
    `window_padding_width  ${config.window.paddingWidth}`,
  ];

  if (config.window.marginWidth > 0) {
    lines.push(`window_margin_width   ${config.window.marginWidth}`);
  }

  lines.push(
    '',
    '# Tab bar',
    `tab_bar_edge ${config.tabBar.edge}`,
    `tab_bar_style ${config.tabBar.style}`,
    '',
    '# Bell',
    `enable_audio_bell ${config.behavior.enableAudioBell ? 'yes' : 'no'}`,
    '',
    '# Shell',
    `shell ${config.behavior.shell}`,
  );

  // Theme include
  if (config.theme.includeFile) {
    lines.push('', '# Theme', `include ${config.theme.includeFile}`);
  }

  // Keybindings
  if (config.keybindings.length > 0) {
    lines.push('', '# Keybindings');
    for (const kb of config.keybindings) {
      lines.push(`map ${kb.key} ${kb.action}`);
    }
  }

  // Preserved raw lines
  if (config.rawLines.length > 0) {
    lines.push('', '# Additional settings');
    lines.push(...config.rawLines);
  }

  return lines.join('\n') + '\n';
}
