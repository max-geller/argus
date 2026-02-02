/**
 * Starship Prompt Configuration Model
 */

export interface StarshipConfig {
  format: string;
  rightFormat: string;
  palette: string;
  palettes: Record<string, Record<string, string>>;
  modules: Record<string, StarshipModule>;
  rawToml: string; // Preserve full TOML for round-trip
}

export interface StarshipModule {
  disabled?: boolean;
  format?: string;
  symbol?: string;
  style?: string;
  [key: string]: unknown; // Allow any additional module settings
}

// Common module names in Starship
export const STARSHIP_MODULES = [
  'os',
  'username',
  'hostname',
  'directory',
  'git_branch',
  'git_status',
  'git_commit',
  'git_state',
  'git_metrics',
  'nodejs',
  'rust',
  'golang',
  'python',
  'java',
  'ruby',
  'php',
  'dotnet',
  'docker_context',
  'kubernetes',
  'terraform',
  'aws',
  'gcloud',
  'azure',
  'time',
  'line_break',
  'character',
  'cmd_duration',
  'memory_usage',
  'battery',
  'package',
] as const;

export type StarshipModuleName = typeof STARSHIP_MODULES[number];

/**
 * Default Starship configuration
 */
export function getDefaultStarshipConfig(): StarshipConfig {
  return {
    format: `$os$username$directory$git_branch$git_status$nodejs$rust$golang$python$line_break$character`,
    rightFormat: '',
    palette: '',
    palettes: {},
    modules: {
      character: {
        success_symbol: '[❯](green)',
        error_symbol: '[❯](red)'
      },
      os: {
        disabled: false
      },
      directory: {
        truncation_length: 3,
        truncate_to_repo: true
      },
      git_branch: {
        symbol: ' '
      }
    },
    rawToml: ''
  };
}

/**
 * Parse Starship TOML content
 * Note: Full TOML parsing happens in the service using a proper parser
 * This provides structure for the parsed result
 */
export function parseStarshipConfig(tomlContent: string): StarshipConfig {
  const config = getDefaultStarshipConfig();
  config.rawToml = tomlContent;

  // Basic line-by-line parsing for simple values
  // More complex parsing happens in the service with toml crate on Rust side
  const lines = tomlContent.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header
    if (trimmed.startsWith('[')) {
      const match = trimmed.match(/^\[([^\]]+)\]/);
      if (match) {
        currentSection = match[1];
        if (!config.modules[currentSection]) {
          config.modules[currentSection] = {};
        }
      }
      continue;
    }

    // Key-value pairs
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove quotes from string values
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Handle top-level settings
      if (!currentSection) {
        if (key === 'format') {
          config.format = value;
        } else if (key === 'right_format') {
          config.rightFormat = value;
        } else if (key === 'palette') {
          config.palette = value;
        }
      } else if (currentSection.startsWith('palettes.')) {
        // Handle palette definitions
        const paletteName = currentSection.replace('palettes.', '');
        if (!config.palettes[paletteName]) {
          config.palettes[paletteName] = {};
        }
        config.palettes[paletteName][key] = value;
      } else {
        // Module settings
        if (!config.modules[currentSection]) {
          config.modules[currentSection] = {};
        }

        // Parse boolean values
        if (value === 'true') {
          config.modules[currentSection][key] = true;
        } else if (value === 'false') {
          config.modules[currentSection][key] = false;
        } else if (!isNaN(Number(value))) {
          config.modules[currentSection][key] = Number(value);
        } else {
          config.modules[currentSection][key] = value;
        }
      }
    }
  }

  return config;
}

/**
 * Stringify StarshipConfig to TOML format
 */
export function stringifyStarshipConfig(config: StarshipConfig): string {
  const lines: string[] = [
    '# Starship Prompt Configuration',
    '# Managed by Argus',
    ''
  ];

  // Top-level format
  if (config.format) {
    lines.push(`format = """`, config.format, `"""`);
    lines.push('');
  }

  if (config.rightFormat) {
    lines.push(`right_format = "${config.rightFormat}"`);
    lines.push('');
  }

  if (config.palette) {
    lines.push(`palette = "${config.palette}"`);
    lines.push('');
  }

  // Palettes
  for (const [paletteName, colors] of Object.entries(config.palettes)) {
    lines.push(`[palettes.${paletteName}]`);
    for (const [colorName, colorValue] of Object.entries(colors)) {
      lines.push(`${colorName} = "${colorValue}"`);
    }
    lines.push('');
  }

  // Modules
  for (const [moduleName, moduleConfig] of Object.entries(config.modules)) {
    if (Object.keys(moduleConfig).length === 0) continue;

    lines.push(`[${moduleName}]`);
    for (const [key, value] of Object.entries(moduleConfig)) {
      if (typeof value === 'string') {
        lines.push(`${key} = "${value}"`);
      } else if (typeof value === 'boolean') {
        lines.push(`${key} = ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`${key} = ${value}`);
      } else if (Array.isArray(value)) {
        const arrayStr = value.map(v => `"${v}"`).join(', ');
        lines.push(`${key} = [${arrayStr}]`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get common module symbols
 */
export function getModuleSymbols(): Record<string, string> {
  return {
    directory: ' ',
    git_branch: ' ',
    git_status: '',
    nodejs: ' ',
    rust: ' ',
    golang: ' ',
    python: ' ',
    java: ' ',
    ruby: ' ',
    php: ' ',
    docker_context: ' ',
    kubernetes: '󱃾 ',
    aws: ' ',
    time: ' ',
    battery: '',
    memory_usage: '󰍛 ',
    package: ' ',
  };
}
