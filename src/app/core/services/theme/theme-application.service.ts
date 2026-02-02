import { Injectable, signal, computed } from '@angular/core';
import { TauriService } from '../tauri.service';
import {
  Theme,
  ThemeApplicationResult,
  ThemePalette,
  resolveAllTokens,
  DEFAULT_SEMANTIC_TOKENS,
} from '../../models/theme';

/**
 * Preview data for config generation
 */
interface ThemePreviewConfigs {
  hyprland: string;
  waybar_css: string;
  kitty: string;
  starship: string;
  rofi: string;
}

/**
 * ThemeApplicationService handles applying themes to the desktop environment.
 * Generates configs for Hyprland, Waybar, Kitty, Starship, and Rofi.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeApplicationService {
  // State signals
  readonly isApplying = signal(false);
  readonly lastApplicationResult = signal<ThemeApplicationResult | null>(null);
  readonly previewConfigs = signal<ThemePreviewConfigs | null>(null);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly appliedApps = computed(() =>
    this.lastApplicationResult()?.appliedTo ?? []
  );
  readonly applicationErrors = computed(() =>
    this.lastApplicationResult()?.errors ?? []
  );
  readonly hasErrors = computed(() =>
    (this.lastApplicationResult()?.errors?.length ?? 0) > 0
  );
  readonly requiresRestart = computed(() =>
    this.lastApplicationResult()?.requiresRestart ?? []
  );

  constructor(private tauri: TauriService) {}

  /**
   * Apply a theme with the specified variant.
   * This will update all configured applications (wallpaper, Hyprland, Waybar, etc.)
   */
  async applyTheme(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<ThemeApplicationResult> {
    this.isApplying.set(true);
    this.error.set(null);

    try {
      const result = await this.tauri.invoke<ThemeApplicationResult>(
        'theme_apply',
        { id: themeId, variant }
      );
      this.lastApplicationResult.set(result);

      if (!result.success) {
        const errorMessages = result.errors
          ?.map((e) => `${e.app}: ${e.error}`)
          .join(', ');
        this.error.set(errorMessages || 'Failed to apply theme');
      }

      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to apply theme';
      this.error.set(errorMessage);
      console.error('Failed to apply theme:', e);

      const failedResult: ThemeApplicationResult = {
        success: false,
        appliedTo: [],
        errors: [{ app: 'system', error: errorMessage }],
        wallpaperChanged: false,
        requiresRestart: [],
      };
      this.lastApplicationResult.set(failedResult);
      return failedResult;
    } finally {
      this.isApplying.set(false);
    }
  }

  /**
   * Preview a theme without applying it.
   * Generates all config files but doesn't write them.
   */
  async previewTheme(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<ThemePreviewConfigs | null> {
    this.error.set(null);

    try {
      const configs = await this.tauri.invoke<ThemePreviewConfigs>(
        'theme_preview',
        { id: themeId, variant }
      );
      this.previewConfigs.set(configs);
      return configs;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate preview';
      this.error.set(errorMessage);
      console.error('Failed to generate preview:', e);
      return null;
    }
  }

  /**
   * Generate Hyprland configuration for a theme.
   */
  async generateHyprlandConfig(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<string | null> {
    try {
      return await this.tauri.invoke<string>('theme_generate_hyprland', {
        id: themeId,
        variant,
      });
    } catch (e) {
      console.error('Failed to generate Hyprland config:', e);
      return null;
    }
  }

  /**
   * Generate Waybar CSS for a theme.
   */
  async generateWaybarCss(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<string | null> {
    try {
      return await this.tauri.invoke<string>('theme_generate_waybar_css', {
        id: themeId,
        variant,
      });
    } catch (e) {
      console.error('Failed to generate Waybar CSS:', e);
      return null;
    }
  }

  /**
   * Generate Kitty configuration for a theme.
   */
  async generateKittyConf(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<string | null> {
    try {
      return await this.tauri.invoke<string>('theme_generate_kitty_conf', {
        id: themeId,
        variant,
      });
    } catch (e) {
      console.error('Failed to generate Kitty config:', e);
      return null;
    }
  }

  /**
   * Generate Starship palette for a theme.
   */
  async generateStarshipPalette(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<string | null> {
    try {
      return await this.tauri.invoke<string>('theme_generate_starship_palette', {
        id: themeId,
        variant,
      });
    } catch (e) {
      console.error('Failed to generate Starship palette:', e);
      return null;
    }
  }

  /**
   * Generate Rofi theme for a theme.
   */
  async generateRofiTheme(
    themeId: string,
    variant: 'day' | 'night'
  ): Promise<string | null> {
    try {
      return await this.tauri.invoke<string>('theme_generate_rofi_theme', {
        id: themeId,
        variant,
      });
    } catch (e) {
      console.error('Failed to generate Rofi theme:', e);
      return null;
    }
  }

  /**
   * Resolve semantic tokens for a palette (client-side preview).
   */
  resolveTokensForPalette(palette: ThemePalette): Record<string, string> {
    return resolveAllTokens(DEFAULT_SEMANTIC_TOKENS, palette);
  }

  /**
   * Get CSS variables string from a palette (for live preview in UI).
   */
  getCssVariablesFromPalette(palette: ThemePalette): string {
    const vars = [
      `--theme-base: ${palette.base};`,
      `--theme-mantle: ${palette.mantle};`,
      `--theme-crust: ${palette.crust};`,
      `--theme-surface0: ${palette.surface0};`,
      `--theme-surface1: ${palette.surface1};`,
      `--theme-surface2: ${palette.surface2};`,
      `--theme-text: ${palette.text};`,
      `--theme-subtext0: ${palette.subtext0};`,
      `--theme-subtext1: ${palette.subtext1};`,
      `--theme-accent: ${palette.accent};`,
      `--theme-secondary: ${palette.secondary};`,
      `--theme-red: ${palette.red};`,
      `--theme-green: ${palette.green};`,
      `--theme-yellow: ${palette.yellow};`,
      `--theme-blue: ${palette.blue};`,
      `--theme-pink: ${palette.pink};`,
      `--theme-teal: ${palette.teal};`,
    ];
    return vars.join('\n');
  }

  /**
   * Clear preview data.
   */
  clearPreview(): void {
    this.previewConfigs.set(null);
  }

  /**
   * Clear error state.
   */
  clearError(): void {
    this.error.set(null);
  }
}
