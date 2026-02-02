/**
 * Theme Palette Model
 *
 * Defines the base color palette and semantic tokens for the theming system.
 * The palette provides 10-15 base colors that semantic tokens reference.
 */

/**
 * Base color palette - the foundation of every theme.
 * These are the actual hex color values.
 */
export interface ThemePalette {
  // Backgrounds (dark to light in dark mode, light to dark in light mode)
  base: string; // Darkest/lightest background
  mantle: string; // Slightly lighter/darker
  crust: string; // Lightest/darkest background layer
  surface0: string; // Card/panel backgrounds
  surface1: string; // Elevated surfaces
  surface2: string; // Highest elevation

  // Text colors
  text: string; // Primary text
  subtext0: string; // Secondary text
  subtext1: string; // Muted text

  // Accent colors
  accent: string; // Primary accent (buttons, links, focus)
  secondary: string; // Secondary accent

  // Semantic colors
  red: string; // Error, destructive actions
  green: string; // Success, positive actions
  yellow: string; // Warning, attention
  blue: string; // Info, links
  pink: string; // Decorative
  teal: string; // Decorative
}

/**
 * Semantic tokens map to palette colors by reference (string key).
 * This allows the same token mappings to work across different palette variants.
 *
 * Example: activeBorder: "accent" means use palette.accent for active borders
 */
export interface SemanticTokens {
  // === Window Manager (Hyprland) ===
  activeBorder: string; // → palette.accent
  inactiveBorder: string; // → palette.surface1
  shadow: string; // → palette.crust (+ alpha in app config)

  // === External Apps ===
  // Waybar
  barBackground: string; // → palette.base
  barForeground: string; // → palette.text
  workspaceActive: string; // → palette.accent
  workspaceEmpty: string; // → palette.surface0
  workspaceVisible: string; // → palette.surface1
  workspaceUrgent: string; // → palette.red

  // Terminal (Kitty)
  cursorColor: string; // → palette.accent
  selectionBg: string; // → palette.surface2
  selectionFg: string; // → palette.text

  // === MaxOS UI Components ===
  // Core semantic colors
  primary: string; // → palette.accent
  secondary: string; // → palette.secondary
  success: string; // → palette.green
  warning: string; // → palette.yellow
  error: string; // → palette.red
  info: string; // → palette.blue

  // Backgrounds (for cards, panels, dialogs)
  bgPrimary: string; // → palette.base
  bgSecondary: string; // → palette.mantle
  bgTertiary: string; // → palette.crust
  bgElevated: string; // → palette.surface0
  bgHover: string; // → palette.surface1
  bgActive: string; // → palette.surface2

  // Text
  textPrimary: string; // → palette.text
  textSecondary: string; // → palette.subtext0
  textMuted: string; // → palette.subtext1
  textDisabled: string; // → palette.surface2
  textOnAccent: string; // → palette.base (for text on accent backgrounds)

  // Borders & Dividers
  border: string; // → palette.surface1
  borderSubtle: string; // → palette.surface0
  divider: string; // → palette.surface0

  // Interactive Elements
  buttonPrimary: string; // → palette.accent
  buttonSecondary: string; // → palette.surface1
  buttonHover: string; // → palette.surface2
  inputBg: string; // → palette.surface0
  inputBorder: string; // → palette.surface1
  inputFocus: string; // → palette.accent

  // Notifications/Toasts
  toastBg: string; // → palette.surface0
  toastBorder: string; // → palette.surface1
  toastSuccess: string; // → palette.green
  toastWarning: string; // → palette.yellow
  toastError: string; // → palette.red
  toastInfo: string; // → palette.blue

  // Widgets/Cards
  cardBg: string; // → palette.surface0
  cardBorder: string; // → palette.surface1
  cardHeaderBg: string; // → palette.surface1

  // Side Panes/Navigation
  navBg: string; // → palette.mantle
  navItemHover: string; // → palette.surface0
  navItemActive: string; // → palette.surface1
  navAccent: string; // → palette.accent

  // Login/Auth screens
  authBg: string; // → palette.base
  authCardBg: string; // → palette.surface0
  authAccent: string; // → palette.accent
}

/**
 * Default semantic token mappings.
 * These map token names to palette color keys.
 */
export const DEFAULT_SEMANTIC_TOKENS: SemanticTokens = {
  // Window Manager
  activeBorder: 'accent',
  inactiveBorder: 'surface1',
  shadow: 'crust',

  // Waybar
  barBackground: 'base',
  barForeground: 'text',
  workspaceActive: 'accent',
  workspaceEmpty: 'surface0',
  workspaceVisible: 'surface1',
  workspaceUrgent: 'red',

  // Terminal
  cursorColor: 'accent',
  selectionBg: 'surface2',
  selectionFg: 'text',

  // Core semantic
  primary: 'accent',
  secondary: 'secondary',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'blue',

  // Backgrounds
  bgPrimary: 'base',
  bgSecondary: 'mantle',
  bgTertiary: 'crust',
  bgElevated: 'surface0',
  bgHover: 'surface1',
  bgActive: 'surface2',

  // Text
  textPrimary: 'text',
  textSecondary: 'subtext0',
  textMuted: 'subtext1',
  textDisabled: 'surface2',
  textOnAccent: 'base',

  // Borders
  border: 'surface1',
  borderSubtle: 'surface0',
  divider: 'surface0',

  // Interactive
  buttonPrimary: 'accent',
  buttonSecondary: 'surface1',
  buttonHover: 'surface2',
  inputBg: 'surface0',
  inputBorder: 'surface1',
  inputFocus: 'accent',

  // Toasts
  toastBg: 'surface0',
  toastBorder: 'surface1',
  toastSuccess: 'green',
  toastWarning: 'yellow',
  toastError: 'red',
  toastInfo: 'blue',

  // Widgets
  cardBg: 'surface0',
  cardBorder: 'surface1',
  cardHeaderBg: 'surface1',

  // Navigation
  navBg: 'mantle',
  navItemHover: 'surface0',
  navItemActive: 'surface1',
  navAccent: 'accent',

  // Auth
  authBg: 'base',
  authCardBg: 'surface0',
  authAccent: 'accent',
};

/**
 * Resolves a semantic token to its actual hex color value.
 * @param token The semantic token reference (e.g., "accent")
 * @param palette The color palette to resolve against
 * @returns The hex color value
 */
export function resolveToken(
  token: string,
  palette: ThemePalette
): string | undefined {
  return palette[token as keyof ThemePalette];
}

/**
 * Resolves all semantic tokens to their hex values.
 * @param tokens The semantic tokens with palette references
 * @param palette The color palette to resolve against
 * @returns Object with all tokens resolved to hex values
 */
export function resolveAllTokens(
  tokens: SemanticTokens,
  palette: ThemePalette
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, paletteKey] of Object.entries(tokens)) {
    const color = resolveToken(paletteKey, palette);
    if (color) {
      resolved[key] = color;
    }
  }
  return resolved;
}

/**
 * Validates a hex color string.
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(color);
}

/**
 * Adds alpha channel to a hex color.
 * @param hex The hex color (e.g., "#ff0000")
 * @param alpha Alpha value 0-1 (e.g., 0.5)
 * @returns Hex color with alpha (e.g., "#ff000080")
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  // Remove existing alpha if present
  const baseHex = hex.length === 9 ? hex.slice(0, 7) : hex;
  return `${baseHex}${alphaHex}`;
}
