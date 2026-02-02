import { Injectable, signal, inject, computed } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  TmuxConfig,
  getDefaultTmuxConfig,
  parseTmuxConfig,
  stringifyTmuxConfig,
  TmuxKeybinding
} from '@core/models/terminal/tmux.model';
import { TerminalBackup } from '@core/models/terminal';

@Injectable({
  providedIn: 'root'
})
export class TmuxService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state
  readonly config = signal<TmuxConfig | null>(null);
  readonly initialConfig = signal<TmuxConfig | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly configPath = signal<string>('');
  readonly configExists = signal(false);
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
   * Load Tmux configuration from file
   */
  async loadConfig(): Promise<void> {
    console.log('=== TmuxService.loadConfig() ===');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!this.tauriService.isRunningInTauri()) {
        throw new Error('Not running in Tauri environment');
      }

      // Check if config exists
      const exists = await this.tauriService.invoke<boolean>('terminal_config_exists', { configType: 'tmux' });
      this.configExists.set(exists);

      // Get config path
      const path = await this.tauriService.invoke<string>('terminal_get_path', { configType: 'tmux' });
      this.configPath.set(path);

      if (!exists) {
        console.log('Tmux config does not exist, using defaults');
        const defaultConfig = getDefaultTmuxConfig();
        this.config.set(defaultConfig);
        this.initialConfig.set(JSON.parse(JSON.stringify(defaultConfig)));
        // Don't show error for tmux - it's expected to not exist
        return;
      }

      // Read config
      const configText = await this.tauriService.invoke<string>('terminal_read_config', { configType: 'tmux' });
      console.log(`Loaded tmux config (${configText.length} chars)`);

      const parsedConfig = parseTmuxConfig(configText);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));

      // Load backups
      await this.loadBackups();

      this.snackBar.open('Tmux config loaded', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Tmux configuration';
      this.error.set(errorMessage);
      console.error('Error loading Tmux config:', err);

      // Set default config as fallback
      this.config.set(getDefaultTmuxConfig());
      this.initialConfig.set(getDefaultTmuxConfig());
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save Tmux configuration to file
   */
  async saveConfig(): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('No configuration to save');
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const configText = stringifyTmuxConfig(currentConfig);

      await this.tauriService.invoke('terminal_write_config', {
        configType: 'tmux',
        content: configText
      });

      this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      this.configExists.set(true);

      // Reload backups
      await this.loadBackups();

      this.snackBar.open('Tmux config saved', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Tmux configuration';
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
  updateConfig(updater: (config: TmuxConfig) => TmuxConfig): void {
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
      const backups = await this.tauriService.invoke<TerminalBackup[]>('terminal_list_backups', { configType: 'tmux' });
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
      await this.tauriService.invoke('terminal_backup_config', { configType: 'tmux' });
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
        configType: 'tmux',
        backupPath
      });

      const parsedConfig = parseTmuxConfig(content);
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
      const content = await this.tauriService.invoke<string>('terminal_create_default', { configType: 'tmux' });
      const parsedConfig = parseTmuxConfig(content);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));
      this.configExists.set(true);
      this.snackBar.open('Default config created', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create default config';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }

  // ========== KEYBINDING MANAGEMENT ==========

  addKeybinding(keybinding: TmuxKeybinding): void {
    this.updateConfig(config => ({
      ...config,
      keybindings: [...config.keybindings, keybinding]
    }));
  }

  updateKeybinding(index: number, keybinding: TmuxKeybinding): void {
    this.updateConfig(config => ({
      ...config,
      keybindings: config.keybindings.map((k, i) => i === index ? keybinding : k)
    }));
  }

  removeKeybinding(index: number): void {
    this.updateConfig(config => ({
      ...config,
      keybindings: config.keybindings.filter((_, i) => i !== index)
    }));
  }

  // ========== GENERAL SETTINGS ==========

  updateGeneral(key: keyof TmuxConfig['general'], value: unknown): void {
    this.updateConfig(config => ({
      ...config,
      general: { ...config.general, [key]: value }
    }));
  }

  // ========== APPEARANCE SETTINGS ==========

  updateAppearance(key: keyof TmuxConfig['appearance'], value: unknown): void {
    this.updateConfig(config => ({
      ...config,
      appearance: { ...config.appearance, [key]: value }
    }));
  }
}
