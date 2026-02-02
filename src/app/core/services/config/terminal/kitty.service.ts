import { Injectable, signal, inject, computed } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  KittyConfig,
  getDefaultKittyConfig,
  parseKittyConfig,
  stringifyKittyConfig
} from '@core/models/terminal/kitty.model';
import { TerminalBackup } from '@core/models/terminal';

@Injectable({
  providedIn: 'root'
})
export class KittyService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state
  readonly config = signal<KittyConfig | null>(null);
  readonly initialConfig = signal<KittyConfig | null>(null);
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
   * Load Kitty configuration from file
   */
  async loadConfig(): Promise<void> {
    console.log('=== KittyService.loadConfig() ===');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!this.tauriService.isRunningInTauri()) {
        throw new Error('Not running in Tauri environment');
      }

      // Check if config exists
      const exists = await this.tauriService.invoke<boolean>('terminal_config_exists', { configType: 'kitty' });
      this.configExists.set(exists);

      // Get config path
      const path = await this.tauriService.invoke<string>('terminal_get_path', { configType: 'kitty' });
      this.configPath.set(path);

      if (!exists) {
        console.log('Kitty config does not exist, using defaults');
        const defaultConfig = getDefaultKittyConfig();
        this.config.set(defaultConfig);
        this.initialConfig.set(JSON.parse(JSON.stringify(defaultConfig)));
        return;
      }

      // Read config
      const configText = await this.tauriService.invoke<string>('terminal_read_config', { configType: 'kitty' });
      console.log(`Loaded kitty config (${configText.length} chars)`);

      const parsedConfig = parseKittyConfig(configText);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));

      // Load backups
      await this.loadBackups();

      this.snackBar.open('Kitty config loaded', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Kitty configuration';
      this.error.set(errorMessage);
      console.error('Error loading Kitty config:', err);

      // Set default config as fallback
      this.config.set(getDefaultKittyConfig());
      this.initialConfig.set(getDefaultKittyConfig());
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save Kitty configuration to file
   */
  async saveConfig(): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('No configuration to save');
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const configText = stringifyKittyConfig(currentConfig);

      await this.tauriService.invoke('terminal_write_config', {
        configType: 'kitty',
        content: configText
      });

      this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      this.configExists.set(true);

      // Reload backups
      await this.loadBackups();

      this.snackBar.open('Kitty config saved', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Kitty configuration';
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
  updateConfig(updater: (config: KittyConfig) => KittyConfig): void {
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
      const backups = await this.tauriService.invoke<TerminalBackup[]>('terminal_list_backups', { configType: 'kitty' });
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
      await this.tauriService.invoke('terminal_backup_config', { configType: 'kitty' });
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
        configType: 'kitty',
        backupPath
      });

      const parsedConfig = parseKittyConfig(content);
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
      const content = await this.tauriService.invoke<string>('terminal_create_default', { configType: 'kitty' });
      const parsedConfig = parseKittyConfig(content);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));
      this.configExists.set(true);
      this.snackBar.open('Default config created', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create default config';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }
}
