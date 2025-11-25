import { Injectable, signal, inject } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface HyprlandConfig {
  monitors: MonitorConfig[];
  general: GeneralConfig;
  decoration: DecorationConfig;
  animations: AnimationsConfig;
  input: InputConfig;
  autostart: AutostartApp[];
  environment: EnvironmentVar[];
}

export interface MonitorConfig {
  name: string;
  resolution: string;
  refreshRate: number;
  position: { x: number; y: number };
  scale: number;
}

export interface GeneralConfig {
  gaps_in: number;
  gaps_out: number;
  border_size: number;
  col_active_border: string;
  col_inactive_border: string;
  layout: 'dwindle' | 'master';
}

export interface DecorationConfig {
  rounding: number;
  blur_enabled: boolean;
  blur_size: number;
  blur_passes: number;
  blur_vibrancy: number;
  shadow_enabled: boolean;
  shadow_range: number;
  shadow_render_power: number;
}

export interface AnimationsConfig {
  enabled: boolean;
  speed: number;
}

export interface InputConfig {
  kb_layout: string;
  follow_mouse: boolean;
  sensitivity: number;
  natural_scroll: boolean;
}

export interface AutostartApp {
  command: string;
  workspace?: number;
  silent?: boolean;
}

export interface EnvironmentVar {
  key: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class HyprlandService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state
  config = signal<HyprlandConfig | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  hasUnsavedChanges = signal<boolean>(false);

  constructor() {
    // Load config on service initialization
    this.loadConfig();
  }

  /**
   * Load Hyprland configuration from file
   */
  async loadConfig(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Check if running in Tauri
      if (!this.tauriService.isRunningInTauri()) {
        throw new Error('Not running in Tauri environment. Please launch the app with `npm run tauri dev` or as a desktop application.');
      }

      // Call Tauri command to read hyprland.conf
      const configText = await this.tauriService.invoke<string>('read_hyprland_config');
      const parsedConfig = this.parseConfig(configText);
      this.config.set(parsedConfig);
      this.hasUnsavedChanges.set(false);
      
      this.snackBar.open('Hyprland config loaded successfully', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Hyprland configuration';
      this.error.set(errorMessage);
      console.error('Error loading Hyprland config:', err);
      
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      
      // Set default config as fallback
      this.config.set(this.getDefaultConfig());
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save Hyprland configuration to file
   */
  async saveConfig(): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      this.snackBar.open('No configuration to save', 'Dismiss', { duration: 3000 });
      throw new Error('No configuration to save');
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Convert config object to Hyprland config format
      const configText = this.stringifyConfig(currentConfig);
      
      // Call Tauri command to write hyprland.conf
      await this.tauriService.invoke('write_hyprland_config', { content: configText });
      
      this.hasUnsavedChanges.set(false);
      this.snackBar.open('Hyprland config saved successfully', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Hyprland configuration';
      this.error.set(errorMessage);
      console.error('Error saving Hyprland config:', err);
      
      this.snackBar.open(`Error saving: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update configuration and mark as having unsaved changes
   */
  updateConfig(updater: (config: HyprlandConfig) => HyprlandConfig): void {
    const current = this.config();
    if (current) {
      this.config.set(updater(current));
      this.hasUnsavedChanges.set(true);
    }
  }

  /**
   * Reset configuration to last saved state
   */
  async resetConfig(): Promise<void> {
    await this.loadConfig();
  }

  /**
   * Reload Hyprland with current configuration
   */
  async reloadHyprland(): Promise<void> {
    try {
      const result = await this.tauriService.invoke<string>('reload_hyprland');
      this.snackBar.open('Hyprland reloaded successfully', 'Dismiss', { duration: 2000 });
      console.log('Hyprland reload result:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reload Hyprland';
      this.error.set(errorMessage);
      this.snackBar.open(`Error reloading: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      throw err;
    }
  }

  /**
   * Parse Hyprland config text into structured format
   */
  private parseConfig(configText: string): HyprlandConfig {
    const config: HyprlandConfig = {
      monitors: [],
      general: {
        gaps_in: 5,
        gaps_out: 10,
        border_size: 2,
        col_active_border: 'rgba(33ccffee)',
        col_inactive_border: 'rgba(595959aa)',
        layout: 'dwindle'
      },
      decoration: {
        rounding: 10,
        blur_enabled: true,
        blur_size: 3,
        blur_passes: 1,
        blur_vibrancy: 0.1696,
        shadow_enabled: true,
        shadow_range: 4,
        shadow_render_power: 3
      },
      animations: {
        enabled: true,
        speed: 7
      },
      input: {
        kb_layout: 'us',
        follow_mouse: true,
        sensitivity: 0,
        natural_scroll: false
      },
      autostart: [],
      environment: []
    };

    const lines = configText.split('\n');
    let currentSection = '';
    let inBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Monitor configuration
      if (trimmed.startsWith('monitor=')) {
        const monitorMatch = trimmed.match(/monitor=([^,]+),(\d+x\d+)@(\d+),(\d+)x(\d+),([0-9.]+)/);
        if (monitorMatch) {
          config.monitors.push({
            name: monitorMatch[1],
            resolution: monitorMatch[2],
            refreshRate: parseInt(monitorMatch[3]),
            position: { x: parseInt(monitorMatch[4]), y: parseInt(monitorMatch[5]) },
            scale: parseFloat(monitorMatch[6])
          });
        }
      }

      // Environment variables
      if (trimmed.startsWith('env =')) {
        const envMatch = trimmed.match(/env\s*=\s*([^,]+),(.+)/);
        if (envMatch) {
          config.environment.push({
            key: envMatch[1].trim(),
            value: envMatch[2].trim()
          });
        }
      }

      // Exec-once (autostart)
      if (trimmed.startsWith('exec-once =')) {
        const execMatch = trimmed.match(/exec-once\s*=\s*(?:\[workspace (\d+)(?: silent)?\]\s*)?(.+)/);
        if (execMatch) {
          config.autostart.push({
            command: execMatch[2].trim(),
            workspace: execMatch[1] ? parseInt(execMatch[1]) : undefined,
            silent: trimmed.includes('silent')
          });
        }
      }

      // Section blocks
      if (trimmed.endsWith('{')) {
        currentSection = trimmed.replace('{', '').trim();
        inBlock = true;
        continue;
      }

      if (trimmed === '}') {
        inBlock = false;
        currentSection = '';
        continue;
      }

      // Parse section content
      if (inBlock && currentSection === 'general') {
        this.parseGeneralConfig(trimmed, config.general);
      } else if (inBlock && currentSection === 'decoration') {
        this.parseDecorationConfig(trimmed, config.decoration);
      } else if (inBlock && currentSection === 'animations') {
        this.parseAnimationsConfig(trimmed, config.animations);
      } else if (inBlock && currentSection === 'input') {
        this.parseInputConfig(trimmed, config.input);
      }
    }

    return config;
  }

  private parseGeneralConfig(line: string, general: GeneralConfig): void {
    const [key, value] = line.split('=').map(s => s.trim());
    switch (key) {
      case 'gaps_in': general.gaps_in = parseInt(value); break;
      case 'gaps_out': general.gaps_out = parseInt(value); break;
      case 'border_size': general.border_size = parseInt(value); break;
      case 'col.active_border': general.col_active_border = value; break;
      case 'col.inactive_border': general.col_inactive_border = value; break;
      case 'layout': general.layout = value as 'dwindle' | 'master'; break;
    }
  }

  private parseDecorationConfig(line: string, decoration: DecorationConfig): void {
    const [key, value] = line.split('=').map(s => s.trim());
    switch (key) {
      case 'rounding': decoration.rounding = parseInt(value); break;
      case 'blur.enabled': decoration.blur_enabled = value === 'true'; break;
      case 'blur.size': decoration.blur_size = parseInt(value); break;
      case 'blur.passes': decoration.blur_passes = parseInt(value); break;
      case 'blur.vibrancy': decoration.blur_vibrancy = parseFloat(value); break;
      case 'shadow.enabled': decoration.shadow_enabled = value === 'true'; break;
      case 'shadow.range': decoration.shadow_range = parseInt(value); break;
      case 'shadow.render_power': decoration.shadow_render_power = parseInt(value); break;
    }
  }

  private parseAnimationsConfig(line: string, animations: AnimationsConfig): void {
    const [key, value] = line.split('=').map(s => s.trim());
    if (key === 'enabled') {
      animations.enabled = value === 'true';
    }
  }

  private parseInputConfig(line: string, input: InputConfig): void {
    const [key, value] = line.split('=').map(s => s.trim());
    switch (key) {
      case 'kb_layout': input.kb_layout = value; break;
      case 'follow_mouse': input.follow_mouse = value === '1'; break;
      case 'sensitivity': input.sensitivity = parseFloat(value); break;
      case 'natural_scroll': input.natural_scroll = value === 'true'; break;
    }
  }

  /**
   * Convert structured config back to Hyprland config format
   */
  private stringifyConfig(config: HyprlandConfig): string {
    let output = '# Hyprland Configuration\n# Generated by Argus\n\n';

    // Monitors
    output += '# Monitor configuration\n';
    for (const monitor of config.monitors) {
      output += `monitor=${monitor.name},${monitor.resolution}@${monitor.refreshRate},${monitor.position.x}x${monitor.position.y},${monitor.scale}\n`;
    }
    output += '\n';

    // Autostart
    output += '# Autostart applications\n';
    for (const app of config.autostart) {
      const workspace = app.workspace ? `[workspace ${app.workspace}${app.silent ? ' silent' : ''}] ` : '';
      output += `exec-once = ${workspace}${app.command}\n`;
    }
    output += '\n';

    // Environment
    output += '# Environment variables\n';
    for (const env of config.environment) {
      output += `env = ${env.key},${env.value}\n`;
    }
    output += '\n';

    // Input
    output += '# Input configuration\n';
    output += 'input {\n';
    output += `    kb_layout = ${config.input.kb_layout}\n`;
    output += `    follow_mouse = ${config.input.follow_mouse ? 1 : 0}\n`;
    output += `    sensitivity = ${config.input.sensitivity}\n`;
    output += '    touchpad {\n';
    output += `        natural_scroll = ${config.input.natural_scroll}\n`;
    output += '    }\n';
    output += '}\n\n';

    // General
    output += '# General settings\n';
    output += 'general {\n';
    output += `    gaps_in = ${config.general.gaps_in}\n`;
    output += `    gaps_out = ${config.general.gaps_out}\n`;
    output += `    border_size = ${config.general.border_size}\n`;
    output += `    col.active_border = ${config.general.col_active_border}\n`;
    output += `    col.inactive_border = ${config.general.col_inactive_border}\n`;
    output += `    layout = ${config.general.layout}\n`;
    output += '}\n\n';

    // Decoration
    output += '# Decoration\n';
    output += 'decoration {\n';
    output += `    rounding = ${config.decoration.rounding}\n`;
    output += '    blur {\n';
    output += `        enabled = ${config.decoration.blur_enabled}\n`;
    output += `        size = ${config.decoration.blur_size}\n`;
    output += `        passes = ${config.decoration.blur_passes}\n`;
    output += `        vibrancy = ${config.decoration.blur_vibrancy}\n`;
    output += '    }\n';
    output += '    shadow {\n';
    output += `        enabled = ${config.decoration.shadow_enabled}\n`;
    output += `        range = ${config.decoration.shadow_range}\n`;
    output += `        render_power = ${config.decoration.shadow_render_power}\n`;
    output += '    }\n';
    output += '}\n\n';

    // Animations
    output += '# Animations\n';
    output += 'animations {\n';
    output += `    enabled = ${config.animations.enabled}\n`;
    output += '}\n';

    return output;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): HyprlandConfig {
    return {
      monitors: [
        { name: 'HDMI-A-1', resolution: '2560x1440', refreshRate: 60, position: { x: 0, y: 0 }, scale: 1 },
        { name: 'DP-3', resolution: '1920x1080', refreshRate: 60, position: { x: 2560, y: 0 }, scale: 1 }
      ],
      general: {
        gaps_in: 5,
        gaps_out: 10,
        border_size: 2,
        col_active_border: 'rgba(33ccffee)',
        col_inactive_border: 'rgba(595959aa)',
        layout: 'dwindle'
      },
      decoration: {
        rounding: 10,
        blur_enabled: true,
        blur_size: 3,
        blur_passes: 1,
        blur_vibrancy: 0.1696,
        shadow_enabled: true,
        shadow_range: 4,
        shadow_render_power: 3
      },
      animations: {
        enabled: true,
        speed: 7
      },
      input: {
        kb_layout: 'us',
        follow_mouse: true,
        sensitivity: 0,
        natural_scroll: false
      },
      autostart: [],
      environment: []
    };
  }
}

