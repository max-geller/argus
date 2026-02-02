import { Injectable, signal, inject, computed } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ZshConfig,
  getDefaultZshConfig,
  parseZshConfig,
  stringifyZshConfig,
  ShellAlias,
  EnvironmentVar,
  ZshPlugin,
  ZshKeybinding
} from '@core/models/terminal/zsh.model';
import { TerminalBackup } from '@core/models/terminal';

@Injectable({
  providedIn: 'root'
})
export class ZshService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state
  readonly config = signal<ZshConfig | null>(null);
  readonly initialConfig = signal<ZshConfig | null>(null);
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
   * Load Zsh configuration from file
   */
  async loadConfig(): Promise<void> {
    console.log('=== ZshService.loadConfig() ===');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (!this.tauriService.isRunningInTauri()) {
        throw new Error('Not running in Tauri environment');
      }

      // Check if config exists
      const exists = await this.tauriService.invoke<boolean>('terminal_config_exists', { configType: 'zsh' });
      this.configExists.set(exists);

      // Get config path
      const path = await this.tauriService.invoke<string>('terminal_get_path', { configType: 'zsh' });
      this.configPath.set(path);

      if (!exists) {
        console.log('Zsh config does not exist, using defaults');
        const defaultConfig = getDefaultZshConfig();
        this.config.set(defaultConfig);
        this.initialConfig.set(JSON.parse(JSON.stringify(defaultConfig)));
        return;
      }

      // Read config
      const configText = await this.tauriService.invoke<string>('terminal_read_config', { configType: 'zsh' });
      console.log(`Loaded zsh config (${configText.length} chars)`);

      const parsedConfig = parseZshConfig(configText);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));

      // Load backups
      await this.loadBackups();

      this.snackBar.open('Zsh config loaded', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Zsh configuration';
      this.error.set(errorMessage);
      console.error('Error loading Zsh config:', err);

      // Set default config as fallback
      this.config.set(getDefaultZshConfig());
      this.initialConfig.set(getDefaultZshConfig());
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save Zsh configuration to file
   */
  async saveConfig(): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('No configuration to save');
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const configText = stringifyZshConfig(currentConfig);

      await this.tauriService.invoke('terminal_write_config', {
        configType: 'zsh',
        content: configText
      });

      this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      this.configExists.set(true);

      // Reload backups
      await this.loadBackups();

      this.snackBar.open('Zsh config saved', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Zsh configuration';
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
  updateConfig(updater: (config: ZshConfig) => ZshConfig): void {
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
      const backups = await this.tauriService.invoke<TerminalBackup[]>('terminal_list_backups', { configType: 'zsh' });
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
      await this.tauriService.invoke('terminal_backup_config', { configType: 'zsh' });
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
        configType: 'zsh',
        backupPath
      });

      const parsedConfig = parseZshConfig(content);
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
      const content = await this.tauriService.invoke<string>('terminal_create_default', { configType: 'zsh' });
      const parsedConfig = parseZshConfig(content);
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));
      this.configExists.set(true);
      this.snackBar.open('Default config created', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create default config';
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
    }
  }

  // ========== ALIAS MANAGEMENT ==========

  addAlias(alias: ShellAlias): void {
    this.updateConfig(config => ({
      ...config,
      aliases: [...config.aliases, alias]
    }));
  }

  updateAlias(index: number, alias: ShellAlias): void {
    this.updateConfig(config => ({
      ...config,
      aliases: config.aliases.map((a, i) => i === index ? alias : a)
    }));
  }

  removeAlias(index: number): void {
    this.updateConfig(config => ({
      ...config,
      aliases: config.aliases.filter((_, i) => i !== index)
    }));
  }

  // ========== ENVIRONMENT VARIABLE MANAGEMENT ==========

  addEnvironmentVar(env: EnvironmentVar): void {
    this.updateConfig(config => ({
      ...config,
      environment: [...config.environment, env]
    }));
  }

  updateEnvironmentVar(index: number, env: EnvironmentVar): void {
    this.updateConfig(config => ({
      ...config,
      environment: config.environment.map((e, i) => i === index ? env : e)
    }));
  }

  removeEnvironmentVar(index: number): void {
    this.updateConfig(config => ({
      ...config,
      environment: config.environment.filter((_, i) => i !== index)
    }));
  }

  // ========== PLUGIN MANAGEMENT ==========

  togglePlugin(index: number): void {
    this.updateConfig(config => ({
      ...config,
      plugins: config.plugins.map((p, i) =>
        i === index ? { ...p, enabled: !p.enabled } : p
      )
    }));
  }

  addPlugin(plugin: ZshPlugin): void {
    this.updateConfig(config => ({
      ...config,
      plugins: [...config.plugins, plugin]
    }));
  }

  removePlugin(index: number): void {
    this.updateConfig(config => ({
      ...config,
      plugins: config.plugins.filter((_, i) => i !== index)
    }));
  }

  // ========== KEYBINDING MANAGEMENT ==========

  addKeybinding(keybinding: ZshKeybinding): void {
    this.updateConfig(config => ({
      ...config,
      keybindings: [...config.keybindings, keybinding]
    }));
  }

  updateKeybinding(index: number, keybinding: ZshKeybinding): void {
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

  // ========== OPTIONS MANAGEMENT ==========

  toggleOption(option: string): void {
    this.updateConfig(config => {
      const options = config.options.includes(option)
        ? config.options.filter(o => o !== option)
        : [...config.options, option];
      return { ...config, options };
    });
  }
}
