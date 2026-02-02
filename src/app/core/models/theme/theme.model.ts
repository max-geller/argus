/**
 * Theme Model
 *
 * Defines the complete theme structure including variants and app-specific configurations.
 */

import { ThemePalette, SemanticTokens, DEFAULT_SEMANTIC_TOKENS } from './palette.model';

/**
 * A theme variant (day or night) contains the wallpaper and color overrides.
 */
export interface ThemeVariant {
  /** Path to the wallpaper image */
  wallpaper: string;

  /** Complete or partial palette - merged with base palette */
  palette: ThemePalette;

  /** Semantic token overrides - merged with defaults */
  semanticTokens?: Partial<SemanticTokens>;
}

/**
 * Hyprland-specific configuration options.
 */
export interface HyprlandAppConfig {
  general?: {
    'col.active_border'?: string; // e.g., "{accent} {secondary} 45deg"
    'col.inactive_border'?: string;
    border_size?: number;
    gaps_in?: number;
    gaps_out?: number;
  };
  decoration?: {
    'col.shadow'?: string;
    'col.shadow_inactive'?: string;
    shadow_range?: number;
    shadow_render_power?: number;
    rounding?: number;
    blur?: {
      enabled?: boolean;
      size?: number;
      passes?: number;
    };
  };
  animations?: {
    enabled?: boolean;
  };
}

/**
 * Waybar-specific configuration options.
 */
export interface WaybarAppConfig {
  /** Custom CSS to append to generated theme CSS */
  customCss?: string;

  /** Module-specific overrides */
  modules?: {
    clock?: {
      format?: string;
      'format-alt'?: string;
    };
    battery?: {
      format?: string;
    };
    [key: string]: Record<string, unknown> | undefined;
  };

  /** Additional CSS variables */
  cssVariables?: Record<string, string>;
}

/**
 * Kitty terminal configuration options.
 */
export interface KittyAppConfig {
  background_opacity?: string;
  cursor?: string; // Color reference like "{accent}"
  cursor_text_color?: string;
  url_color?: string;
  selection_foreground?: string;
  selection_background?: string;
  font_size?: number;
  font_family?: string;
}

/**
 * Starship prompt configuration options.
 */
export interface StarshipAppConfig {
  /** Name for the palette in starship.toml */
  palette_name?: string;

  /** Additional palette colors beyond the theme palette */
  extra_colors?: Record<string, string>;
}

/**
 * Rofi launcher configuration options.
 */
export interface RofiAppConfig {
  border_width?: string;
  border_radius?: string;
  font?: string;
  /** Additional rasi properties */
  extra?: Record<string, string>;
}

/**
 * App-specific configurations within a theme.
 */
export interface ThemeAppConfigs {
  hyprland?: HyprlandAppConfig;
  waybar?: WaybarAppConfig;
  kitty?: KittyAppConfig;
  starship?: StarshipAppConfig;
  rofi?: RofiAppConfig;
}

/**
 * Complete theme definition.
 */
export interface Theme {
  /** Unique identifier (e.g., "january-frost") */
  id: string;

  /** Display name (e.g., "January Frost") */
  name: string;

  /** Theme description */
  description?: string;

  /** Theme author */
  author?: string;

  /** Theme version (semver) */
  version?: string;

  /** Day and night variants */
  variants: {
    day: ThemeVariant;
    night?: ThemeVariant; // Optional - if missing, uses day variant
  };

  /** App-specific configurations */
  apps?: ThemeAppConfigs;

  /** Theme tags for filtering (e.g., ["winter", "cool", "minimal"]) */
  tags?: string[];

  /** Associated month (1-12) if this is a monthly theme */
  month?: number;

  /** Is this a holiday theme? */
  isHoliday?: boolean;

  /** Creation timestamp */
  createdAt?: string;

  /** Last modified timestamp */
  updatedAt?: string;
}

/**
 * Metadata for theme listings (without full palette data).
 */
export interface ThemeMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  month?: number;
  isHoliday?: boolean;
  dayWallpaper: string;
  nightWallpaper?: string;
  accentColor: string; // Primary accent color for preview
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Currently active theme state.
 */
export interface ActiveThemeState {
  /** The active theme */
  theme: Theme;

  /** Current variant (day or night) */
  variant: 'day' | 'night';

  /** Resolved palette with actual colors */
  resolvedPalette: ThemePalette;

  /** Resolved semantic tokens */
  resolvedTokens: Record<string, string>;

  /** When the variant was last switched */
  lastSwitched: string;

  /** Next scheduled switch time (if auto-switching enabled) */
  nextSwitch?: string;
}

/**
 * Theme application result from backend.
 */
export interface ThemeApplicationResult {
  success: boolean;
  appliedTo: string[];
  errors?: { app: string; error: string }[];
  wallpaperChanged: boolean;
  requiresRestart?: string[]; // Apps that need restart (e.g., Kitty)
}

/**
 * Theme preview data for gallery display.
 */
export interface ThemePreview {
  id: string;
  name: string;
  description?: string;
  dayWallpaperThumbnail?: string; // Base64 or path to thumbnail
  nightWallpaperThumbnail?: string;
  palette: ThemePalette;
  accentColor: string;
  tags?: string[];
}

/**
 * Creates a default theme structure.
 */
export function createDefaultTheme(id: string, name: string): Theme {
  return {
    id,
    name,
    description: '',
    author: 'MaxOS User',
    version: '1.0.0',
    variants: {
      day: {
        wallpaper: '',
        palette: createDefaultPalette('day'),
        semanticTokens: { ...DEFAULT_SEMANTIC_TOKENS },
      },
      night: {
        wallpaper: '',
        palette: createDefaultPalette('night'),
        semanticTokens: { ...DEFAULT_SEMANTIC_TOKENS },
      },
    },
    apps: {},
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates a default palette based on Catppuccin Macchiato (dark) or Latte (light).
 */
export function createDefaultPalette(variant: 'day' | 'night'): ThemePalette {
  if (variant === 'night') {
    // Catppuccin Macchiato inspired
    return {
      base: '#24273a',
      mantle: '#1e2030',
      crust: '#181926',
      surface0: '#363a4f',
      surface1: '#494d64',
      surface2: '#5b6078',
      text: '#cad3f5',
      subtext0: '#a5adcb',
      subtext1: '#8087a2',
      accent: '#8aadf4',
      secondary: '#b7bdf8',
      red: '#ed8796',
      green: '#a6da95',
      yellow: '#eed49f',
      blue: '#8aadf4',
      pink: '#f5bde6',
      teal: '#8bd5ca',
    };
  } else {
    // Catppuccin Latte inspired (light mode)
    return {
      base: '#eff1f5',
      mantle: '#e6e9ef',
      crust: '#dce0e8',
      surface0: '#ccd0da',
      surface1: '#bcc0cc',
      surface2: '#acb0be',
      text: '#4c4f69',
      subtext0: '#5c5f77',
      subtext1: '#6c6f85',
      accent: '#1e66f5',
      secondary: '#7287fd',
      red: '#d20f39',
      green: '#40a02b',
      yellow: '#df8e1d',
      blue: '#1e66f5',
      pink: '#ea76cb',
      teal: '#179299',
    };
  }
}

/**
 * Merges a partial palette with a base palette.
 */
export function mergePalettes(
  base: ThemePalette,
  overrides: Partial<ThemePalette>
): ThemePalette {
  return { ...base, ...overrides };
}

/**
 * Extracts theme metadata from a full theme.
 */
export function themeToMetadata(theme: Theme): ThemeMetadata {
  return {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    author: theme.author,
    version: theme.version,
    tags: theme.tags,
    month: theme.month,
    isHoliday: theme.isHoliday,
    dayWallpaper: theme.variants.day.wallpaper,
    nightWallpaper: theme.variants.night?.wallpaper,
    accentColor: theme.variants.day.palette.accent,
    createdAt: theme.createdAt,
    updatedAt: theme.updatedAt,
  };
}

/**
 * Gets the appropriate variant based on time of day.
 */
export function getVariantForTime(
  theme: Theme,
  isDay: boolean
): ThemeVariant {
  if (isDay || !theme.variants.night) {
    return theme.variants.day;
  }
  return theme.variants.night;
}

/**
 * Validates a theme structure.
 */
export function validateTheme(theme: Theme): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!theme.id || theme.id.trim() === '') {
    errors.push('Theme ID is required');
  }

  if (!theme.name || theme.name.trim() === '') {
    errors.push('Theme name is required');
  }

  if (!theme.variants?.day) {
    errors.push('Day variant is required');
  }

  if (!theme.variants?.day?.palette) {
    errors.push('Day variant must have a palette');
  }

  // Validate palette colors
  if (theme.variants?.day?.palette) {
    const palette = theme.variants.day.palette;
    const requiredKeys: (keyof ThemePalette)[] = [
      'base', 'mantle', 'crust', 'surface0', 'surface1', 'surface2',
      'text', 'subtext0', 'subtext1', 'accent', 'secondary',
      'red', 'green', 'yellow', 'blue', 'pink', 'teal'
    ];

    for (const key of requiredKeys) {
      if (!palette[key]) {
        errors.push(`Palette missing required color: ${key}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
