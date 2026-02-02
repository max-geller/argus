import { Injectable, signal, inject, computed } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  StarshipConfig,
  getDefaultStarshipConfig,
  parseStarshipConfig,
  stringifyStarshipConfig
} from '@core/models/terminal/starship.model';
import { TerminalBackup } from '@core/models/terminal';

@Injectable({
  providedIn: 'root'
})
export class StarshipService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state
  readonly config = signal<StarshipConfig | null>(null);
  readonly initialConfig = signal<StarshipConfig | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly configPath = signal<string>('');
  readonly configExists = signal(true);
  readonly backups = signal<TerminalBackup[]>([]);

  readonly hasUnsavedChanges = computed(() => {
    const current = this.config();
    const initial = this.initialConfig();
    return current !== null && initial !== null &&
           JSON.stringify(current) !== JSON.stringify(initial);
  });

  constructor() {
    this.loadConfig();
  }

  /**
   * Load Starship configuration from file
   */
  async loadConfig(): Promise<void> {
    console.log('=== StarshipService.loadConfig() ===');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!this.tauriService.isRunningInTauri()) {
        throw new Error('Not running in Tauri environment');
      }

      // Check if config exists
      const exists = await this.tauriService.invoke<boolean>('terminal_config_exists', { configType: 'starship' });
      this.configExists.set(exists);

      // Get config path
      const path = await this.tauriService.invoke<string>('terminal_get_path', { configType: 'starship' });
      this.configPath.set(path);

      if (!exists) {
        console.log('Starship config does not exist, using defaults');
        const defaultConfig = getDefaultStarshipConfig();
        this.config.set(defaultConfig);
        this.initialConfig.set(JSON.parse(JSON.stringify(defaultConfig)));
        return;
      }

      // Read config
      const configText = await this.tauriService.invoke<string>('terminal_read_config', { configType: 'starship' });
      console.log(`Loaded starship config (${configText.length} chars)`);

      const parsedConfig = parseStarshipConfig(configText);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));

      // Load backups
      await this.loadBackups();

      this.snackBar.open('Starship config loaded', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Starship configuration';
      this.error.set(errorMessage);
      console.error('Error loading Starship config:', err);

      // Set default config as fallback
      this.config.set(getDefaultStarshipConfig());
      this.initialConfig.set(getDefaultStarshipConfig());
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save Starship configuration to file
   */
  async saveConfig(): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('No configuration to save');
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const configText = stringifyStarshipConfig(currentConfig);

      await this.tauriService.invoke('terminal_write_config', {
        configType: 'starship',
        content: configText
      });

      this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      this.configExists.set(true);

      // Reload backups
      await this.loadBackups();

      this.snackBar.open('Starship config saved', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Starship configuration';
      this.error.set(errorMessage);
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updater: (config: StarshipConfig) => StarshipConfig): void {
    const current = this.config();
    if (current) {
      this.config.set(updater(current));
    }
  }

  /**
   * Reset configuration to last saved state
   */
  resetConfig(): void {
    const initial = this.initialConfig();
    if (initial) {
      this.config.set(JSON.parse(JSON.stringify(initial)));
      this.snackBar.open('Configuration reset', 'Dismiss', { duration: 2000 });
    }
  }

  /**
   * Load backup list
   */
  async loadBackups(): Promise<void> {
    try {
      const backups = await this.tauriService.invoke<TerminalBackup[]>('terminal_list_backups', { configType: 'starship' });
      this.backups.set(backups);
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  }

  /**
   * Create a backup
   */
  async createBackup(): Promise<void> {
    try {
      await this.tauriService.invoke('terminal_backup_config', { configType: 'starship' });
      await this.loadBackups();
      this.snackBar.open('Backup created', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      const content = await this.tauriService.invoke<string>('terminal_restore_backup', {
        configType: 'starship',
        backupPath
      });

      const parsedConfig = parseStarshipConfig(content);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));

      await this.loadBackups();
      this.snackBar.open('Backup restored', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore backup';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupPath: string): Promise<void> {
    try {
      await this.tauriService.invoke('terminal_delete_backup', { backupPath });
      await this.loadBackups();
      this.snackBar.open('Backup deleted', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete backup';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Create default config if none exists
   */
  async createDefaultConfig(): Promise<void> {
    try {
      const content = await this.tauriService.invoke<string>('terminal_create_default', { configType: 'starship' });
      const parsedConfig = parseStarshipConfig(content);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));
      this.configExists.set(true);
      this.snackBar.open('Default config created', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create default config';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }

  /**
   * Toggle a module's disabled state
   */
  toggleModule(moduleName: string): void {
    const current = this.config();
    if (!current) return;

    const modules = { ...current.modules };
    if (!modules[moduleName]) {
      modules[moduleName] = { disabled: false };
    } else {
      modules[moduleName] = {
        ...modules[moduleName],
        disabled: !modules[moduleName].disabled
      };
    }

    this.config.set({ ...current, modules });
  }

  /**
   * Update a module's settings
   */
  updateModule(moduleName: string, settings: Record<string, unknown>): void {
    const current = this.config();
    if (!current) return;

    const modules = { ...current.modules };
    modules[moduleName] = {
      ...modules[moduleName],
      ...settings
    };

    this.config.set({ ...current, modules });
  }

  /**
   * Update palette color
   */
  updatePaletteColor(paletteName: string, colorName: string, colorValue: string): void {
    const current = this.config();
    if (!current) return;

    const palettes = { ...current.palettes };
    if (!palettes[paletteName]) {
      palettes[paletteName] = {};
    }
    palettes[paletteName] = {
      ...palettes[paletteName],
      [colorName]: colorValue
    };

    this.config.set({ ...current, palettes });
  }
}
