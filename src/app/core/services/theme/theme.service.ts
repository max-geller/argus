import { Injectable, signal, computed } from '@angular/core';
import { TauriService } from '../tauri.service';
import {
  Theme,
  ThemeMetadata,
  ActiveThemeState,
  createDefaultTheme,
  validateTheme,
} from '../../models/theme';

/**
 * Active theme info from the backend
 */
interface ActiveThemeInfo {
  themeId: string;
  themeName: string;
  variant: string;
  wallpaper: string;
  accentColor: string;
  appliedAt: string;
}

/**
 * ThemeService handles theme CRUD operations and state management.
 * Uses Angular signals for reactive state.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // State signals
  readonly themes = signal<ThemeMetadata[]>([]);
  readonly currentTheme = signal<Theme | null>(null);
  readonly activeThemeInfo = signal<ActiveThemeInfo | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly hasThemes = computed(() => this.themes().length > 0);
  readonly monthlyThemes = computed(() =>
    this.themes().filter((t) => t.month !== undefined && !t.isHoliday)
  );
  readonly holidayThemes = computed(() =>
    this.themes().filter((t) => t.isHoliday === true)
  );
  readonly customThemes = computed(() =>
    this.themes().filter((t) => t.month === undefined && !t.isHoliday)
  );

  constructor(private tauri: TauriService) {}

  /**
   * Load all available themes from the backend.
   */
  async loadThemes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const themes = await this.tauri.invoke<ThemeMetadata[]>('theme_list');
      this.themes.set(themes);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load themes';
      this.error.set(errorMessage);
      console.error('Failed to load themes:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get a theme by ID.
   */
  async getTheme(id: string): Promise<Theme | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const theme = await this.tauri.invoke<Theme>('theme_get', { id });
      this.currentTheme.set(theme);
      return theme;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load theme';
      this.error.set(errorMessage);
      console.error('Failed to load theme:', e);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save a theme (create or update).
   */
  async saveTheme(theme: Theme): Promise<boolean> {
    // Validate theme before saving
    const validation = validateTheme(theme);
    if (!validation.valid) {
      this.error.set(validation.errors.join(', '));
      return false;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.tauri.invoke('theme_save', { theme });
      // Refresh theme list
      await this.loadThemes();
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save theme';
      this.error.set(errorMessage);
      console.error('Failed to save theme:', e);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Delete a theme by ID.
   */
  async deleteTheme(id: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.tauri.invoke('theme_delete', { id });
      // Clear current theme if it was deleted
      if (this.currentTheme()?.id === id) {
        this.currentTheme.set(null);
      }
      // Refresh theme list
      await this.loadThemes();
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete theme';
      this.error.set(errorMessage);
      console.error('Failed to delete theme:', e);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get the currently active theme info.
   */
  async loadActiveTheme(): Promise<void> {
    try {
      const info = await this.tauri.invoke<ActiveThemeInfo | null>('theme_get_current');
      this.activeThemeInfo.set(info);

      // Also load the full theme if we have active info
      if (info?.themeId) {
        await this.getTheme(info.themeId);
      }
    } catch (e) {
      console.error('Failed to load active theme:', e);
    }
  }

  /**
   * Create a new theme with defaults.
   */
  createNewTheme(id: string, name: string): Theme {
    return createDefaultTheme(id, name);
  }

  /**
   * Duplicate an existing theme.
   */
  async duplicateTheme(sourceId: string, newId: string, newName: string): Promise<Theme | null> {
    const source = await this.getTheme(sourceId);
    if (!source) {
      this.error.set('Source theme not found');
      return null;
    }

    const duplicate: Theme = {
      ...source,
      id: newId,
      name: newName,
      createdAt: undefined,
      updatedAt: undefined,
    };

    const success = await this.saveTheme(duplicate);
    return success ? duplicate : null;
  }

  /**
   * Export a theme to JSON string.
   */
  async exportTheme(id: string): Promise<string | null> {
    const theme = await this.getTheme(id);
    if (!theme) {
      return null;
    }
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import a theme from JSON string.
   */
  async importTheme(json: string): Promise<boolean> {
    try {
      const theme = JSON.parse(json) as Theme;

      // Validate imported theme
      const validation = validateTheme(theme);
      if (!validation.valid) {
        this.error.set(`Invalid theme: ${validation.errors.join(', ')}`);
        return false;
      }

      // Check if theme ID already exists
      const existing = this.themes().find((t) => t.id === theme.id);
      if (existing) {
        this.error.set(`Theme with ID "${theme.id}" already exists`);
        return false;
      }

      return await this.saveTheme(theme);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to parse theme JSON';
      this.error.set(errorMessage);
      return false;
    }
  }

  /**
   * Get themes for a specific month.
   */
  getThemesForMonth(month: number): ThemeMetadata[] {
    return this.themes().filter((t) => t.month === month);
  }

  /**
   * Clear the current error.
   */
  clearError(): void {
    this.error.set(null);
  }
}
