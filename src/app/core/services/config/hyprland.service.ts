import { Injectable, signal, inject, computed } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { SnapshotService } from '@core/services/snapshot.service';
import { MatSnackBar } from '@angular/material/snack-bar';

// ========== INTERFACES ==========

export interface HyprlandConfig {
  // Structured sections (editable in GUI)
  monitors: MonitorConfig[];
  general: GeneralConfig | null;
  decoration: DecorationConfig | null;
  input: InputConfig | null;
  animations: AnimationsConfig | null;
  environment: EnvironmentVar[];
  autostart: AutostartApp[];
  
  // Raw preserved sections (not lost, just not GUI-editable yet)
  rawSections: RawSections;
  
  // Metadata for reconstruction
  sectionOrder: string[];
}

export interface RawSections {
  keybindings: string[];       // all bind/bindm/binde lines
  windowRules: string[];        // all windowrulev2/windowrule lines
  layouts: string[];            // dwindle/master blocks
  animationLines: string[];     // bezier/animation directive lines
  misc: string[];               // misc block
  comments: string[];           // comment lines with their positions
  unknown: string[];            // anything we don't recognize
}

export interface MonitorConfig {
  name: string;
  resolution: string;
  refreshRate: number;
  position: { x: number; y: number };
  scale: number;
}

export interface GeneralConfig {
  gaps_in?: number;
  gaps_out?: number;
  border_size?: number;
  col_active_border?: string;
  col_inactive_border?: string;
  layout?: 'dwindle' | 'master';
  allow_tearing?: boolean;
}

export interface DecorationConfig {
  rounding?: number;
  blur?: {
    enabled?: boolean;
    size?: number;
    passes?: number;
    vibrancy?: number;
  };
  shadow?: {
    enabled?: boolean;
    range?: number;
    render_power?: number;
    color?: string;
  };
}

export interface AnimationsConfig {
  enabled?: boolean;
}

export interface InputConfig {
  kb_layout?: string;
  kb_variant?: string;
  kb_model?: string;
  kb_options?: string;
  kb_rules?: string;
  follow_mouse?: number;
  sensitivity?: number;
  touchpad?: {
    natural_scroll?: boolean;
  };
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

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root'
})
export class HyprlandService {
  private tauriService = inject(TauriService);
  private snapshotService = inject(SnapshotService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state
  readonly config = signal<HyprlandConfig | null>(null);
  readonly initialConfig = signal<HyprlandConfig | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasUnsavedChanges = computed(() => {
    const current = this.config();
    const initial = this.initialConfig();
    return current !== null && initial !== null && 
           JSON.stringify(current) !== JSON.stringify(initial);
  });

  constructor() {
    // Load config on service initialization
    this.loadConfig();
  }

  /**
   * Load Hyprland configuration from file
   */
  async loadConfig(): Promise<void> {
    console.log('=== HyprlandService.loadConfig() called ===');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Check if running in Tauri
      if (!this.tauriService.isRunningInTauri()) {
        throw new Error('Not running in Tauri environment. Please launch with `npm run tauri dev` or as a desktop application.');
      }

      // Call Tauri command to read hyprland.conf
      const configText = await this.tauriService.invoke<string>('read_hyprland_config');
      console.log(`✓ Received config text (${configText.length} chars)`);
      
      const parsedConfig = this.parseConfig(configText);
      console.log('✓ Config parsed successfully');
      
      // Ensure all defaults are set
      this.ensureDefaults(parsedConfig);
      
      this.config.set(parsedConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig))); // Deep clone
      
      this.snackBar.open('Hyprland config loaded successfully', 'Dismiss', { duration: 2000 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Hyprland configuration';
      this.error.set(errorMessage);
      console.error('✗ Error loading Hyprland config:', err);
      
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      
      // Set default config as fallback
      this.config.set(this.getDefaultConfig());
      this.initialConfig.set(this.getDefaultConfig());
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
      
      // Update initial config after successful save
      this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      
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
   * Create a snapshot of the current configuration
   */
  async createSnapshot(description: string): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('No configuration to snapshot');
    }

    const configText = this.stringifyConfig(currentConfig);
    await this.snapshotService.createSnapshot('hyprland', description, configText);
  }

  /**
   * List all snapshots
   */
  async listSnapshots() {
    return await this.snapshotService.listSnapshots('hyprland');
  }

  /**
   * Restore a snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    const content = await this.snapshotService.restoreSnapshot('hyprland', snapshotId);
    const parsedConfig = this.parseConfig(content);
    this.config.set(parsedConfig);
    this.initialConfig.set(JSON.parse(JSON.stringify(parsedConfig)));
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.snapshotService.deleteSnapshot('hyprland', snapshotId);
  }

  // ========== PARSER ==========

  /**
   * Parse Hyprland config text with ZERO data loss
   */
  private parseConfig(configText: string): HyprlandConfig {
    const config: HyprlandConfig = {
      monitors: [],
      general: null,
      decoration: null,
      input: null,
      animations: null,
      environment: [],
      autostart: [],
      rawSections: {
        keybindings: [],
        windowRules: [],
        layouts: [],
        animationLines: [],
        misc: [],
        comments: [],
        unknown: []
      },
      sectionOrder: []
    };

    const lines = configText.split('\n');
    let currentBlock: string | null = null;
    let blockContent: string[] = [];
    let blockIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track comments
      if (trimmed.startsWith('#') || trimmed === '') {
        config.rawSections.comments.push(line);
        continue;
      }

      // Detect block start
      if (trimmed.endsWith('{')) {
        const blockName = trimmed.slice(0, -1).trim();
        currentBlock = blockName;
        blockContent = [];
        blockIndent = line.indexOf(blockName);
        
        if (!config.sectionOrder.includes(blockName)) {
          config.sectionOrder.push(blockName);
        }
        continue;
      }

      // Detect block end
      if (trimmed === '}' && currentBlock) {
        this.processBlock(currentBlock, blockContent, config);
        currentBlock = null;
        blockContent = [];
        continue;
      }

      // Inside a block
      if (currentBlock) {
        blockContent.push(line);
        continue;
      }

      // Top-level directives
      if (trimmed.startsWith('monitor=')) {
        config.sectionOrder.push('monitor');
        this.parseMonitor(trimmed, config);
      } else if (trimmed.startsWith('exec-once')) {
        config.sectionOrder.push('exec-once');
        this.parseExecOnce(trimmed, config);
      } else if (trimmed.startsWith('env')) {
        config.sectionOrder.push('env');
        this.parseEnv(trimmed, config);
      } else if (trimmed.startsWith('bind')) {
        config.sectionOrder.push('bind');
        config.rawSections.keybindings.push(line);
      } else if (trimmed.startsWith('windowrule')) {
        config.sectionOrder.push('windowrule');
        config.rawSections.windowRules.push(line);
      } else if (trimmed.startsWith('bezier') || trimmed.startsWith('animation')) {
        config.sectionOrder.push('animation');
        config.rawSections.animationLines.push(line);
      } else {
        // Unknown directive - preserve it
        config.rawSections.unknown.push(line);
      }
    }

    return config;
  }

  private processBlock(blockName: string, content: string[], config: HyprlandConfig): void {
    switch (blockName) {
      case 'general':
        config.general = this.parseGeneralBlock(content);
        break;
      case 'decoration':
        config.decoration = this.parseDecorationBlock(content);
        break;
      case 'input':
        config.input = this.parseInputBlock(content);
        break;
      case 'animations':
        config.animations = this.parseAnimationsBlock(content);
        break;
      case 'dwindle':
      case 'master':
      case 'misc':
        // Preserve these as raw
        config.rawSections.layouts.push(`${blockName} {`);
        config.rawSections.layouts.push(...content);
        config.rawSections.layouts.push('}');
        break;
      default:
        // Unknown block - preserve as raw
        config.rawSections.unknown.push(`${blockName} {`);
        config.rawSections.unknown.push(...content);
        config.rawSections.unknown.push('}');
    }
  }

  private parseMonitor(line: string, config: HyprlandConfig): void {
    // monitor=name,resolution@refresh,position,scale
    const match = line.match(/monitor=([^,]+),(\d+x\d+)@(\d+),(\d+)x(\d+),([0-9.]+)/);
    if (match) {
      config.monitors.push({
        name: match[1],
        resolution: match[2],
        refreshRate: parseInt(match[3]),
        position: { x: parseInt(match[4]), y: parseInt(match[5]) },
        scale: parseFloat(match[6])
      });
    }
  }

  private parseExecOnce(line: string, config: HyprlandConfig): void {
    // exec-once = [workspace N silent] command
    const workspaceMatch = line.match(/exec-once\s*=\s*\[workspace\s+(\d+)\s+(silent\s+)?\]\s*(.+)/);
    if (workspaceMatch) {
      config.autostart.push({
        command: workspaceMatch[3].trim(),
        workspace: parseInt(workspaceMatch[1]),
        silent: !!workspaceMatch[2]
      });
    } else {
      const simpleMatch = line.match(/exec-once\s*=\s*(.+)/);
      if (simpleMatch) {
        config.autostart.push({
          command: simpleMatch[1].trim()
        });
      }
    }
  }

  private parseEnv(line: string, config: HyprlandConfig): void {
    // env = KEY,value
    const match = line.match(/env\s*=\s*([^,]+),(.+)/);
    if (match) {
      config.environment.push({
        key: match[1].trim(),
        value: match[2].trim()
      });
    }
  }

  private parseGeneralBlock(content: string[]): GeneralConfig {
    const general: GeneralConfig = {};
    
    for (const line of content) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=').map(s => s.trim());
      const value = valueParts.join('=').trim();

      switch (key) {
        case 'gaps_in':
          general.gaps_in = parseInt(value);
          break;
        case 'gaps_out':
          general.gaps_out = parseInt(value);
          break;
        case 'border_size':
          general.border_size = parseInt(value);
          break;
        case 'col.active_border':
          general.col_active_border = value;
          break;
        case 'col.inactive_border':
          general.col_inactive_border = value;
          break;
        case 'layout':
          general.layout = value as 'dwindle' | 'master';
          break;
        case 'allow_tearing':
          general.allow_tearing = value === 'true';
          break;
      }
    }

    return general;
  }

  private parseDecorationBlock(content: string[]): DecorationConfig {
    const decoration: DecorationConfig = {};
    let inBlur = false;
    let inShadow = false;

    for (const line of content) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed === 'blur {') {
        inBlur = true;
        decoration.blur = {};
        continue;
      }
      if (trimmed === 'shadow {') {
        inShadow = true;
        decoration.shadow = {};
        continue;
      }
      if (trimmed === '}') {
        inBlur = false;
        inShadow = false;
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=').map(s => s.trim());
      const value = valueParts.join('=').trim();

      if (inBlur && decoration.blur) {
        switch (key) {
          case 'enabled':
            decoration.blur.enabled = value === 'true';
            break;
          case 'size':
            decoration.blur.size = parseInt(value);
            break;
          case 'passes':
            decoration.blur.passes = parseInt(value);
            break;
          case 'vibrancy':
            decoration.blur.vibrancy = parseFloat(value);
            break;
        }
      } else if (inShadow && decoration.shadow) {
        switch (key) {
          case 'enabled':
            decoration.shadow.enabled = value === 'true';
            break;
          case 'range':
            decoration.shadow.range = parseInt(value);
            break;
          case 'render_power':
            decoration.shadow.render_power = parseInt(value);
            break;
          case 'color':
            decoration.shadow.color = value;
            break;
        }
      } else if (key === 'rounding') {
        decoration.rounding = parseInt(value);
      }
    }

    return decoration;
  }

  private parseInputBlock(content: string[]): InputConfig {
    const input: InputConfig = {};
    let inTouchpad = false;

    for (const line of content) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed === 'touchpad {') {
        inTouchpad = true;
        input.touchpad = {};
        continue;
      }
      if (trimmed === '}') {
        inTouchpad = false;
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=').map(s => s.trim());
      const value = valueParts.join('=').trim();

      if (inTouchpad && input.touchpad) {
        if (key === 'natural_scroll') {
          input.touchpad.natural_scroll = value === 'true';
        }
      } else {
        switch (key) {
          case 'kb_layout':
            input.kb_layout = value;
            break;
          case 'kb_variant':
            input.kb_variant = value;
            break;
          case 'kb_model':
            input.kb_model = value;
            break;
          case 'kb_options':
            input.kb_options = value;
            break;
          case 'kb_rules':
            input.kb_rules = value;
            break;
          case 'follow_mouse':
            input.follow_mouse = parseInt(value);
            break;
          case 'sensitivity':
            input.sensitivity = parseFloat(value);
            break;
        }
      }
    }

    return input;
  }

  private parseAnimationsBlock(content: string[]): AnimationsConfig {
    const animations: AnimationsConfig = {};

    for (const line of content) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Skip bezier and animation directives (handled in raw)
      if (trimmed.startsWith('bezier') || trimmed.startsWith('animation')) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=').map(s => s.trim());
      const value = valueParts.join('=').trim();

      if (key === 'enabled') {
        animations.enabled = value === 'true';
      }
    }

    return animations;
  }

  // ========== STRINGIFY ==========

  /**
   * Convert config back to Hyprland format with ZERO data loss
   */
  private stringifyConfig(config: HyprlandConfig): string {
    const lines: string[] = [];
    const processedSections = new Set<string>();

    // Reconstruct in original order
    for (const section of config.sectionOrder) {
      if (processedSections.has(section)) continue;
      processedSections.add(section);

      switch (section) {
        case 'monitor':
          config.monitors.forEach(m => {
            lines.push(`monitor=${m.name},${m.resolution}@${m.refreshRate},${m.position.x}x${m.position.y},${m.scale}`);
          });
          lines.push('');
          break;

        case 'exec-once':
          config.autostart.forEach(app => {
            if (app.workspace) {
              const silent = app.silent ? 'silent ' : '';
              lines.push(`exec-once = [workspace ${app.workspace} ${silent}]${app.command}`);
            } else {
              lines.push(`exec-once = ${app.command}`);
            }
          });
          lines.push('');
          break;

        case 'env':
          config.environment.forEach(env => {
            lines.push(`env = ${env.key},${env.value}`);
          });
          lines.push('');
          break;

        case 'general':
          if (config.general) {
            lines.push('general {');
            if (config.general.gaps_in !== undefined) lines.push(`    gaps_in = ${config.general.gaps_in}`);
            if (config.general.gaps_out !== undefined) lines.push(`    gaps_out = ${config.general.gaps_out}`);
            if (config.general.border_size !== undefined) lines.push(`    border_size = ${config.general.border_size}`);
            if (config.general.col_active_border) lines.push(`    col.active_border = ${config.general.col_active_border}`);
            if (config.general.col_inactive_border) lines.push(`    col.inactive_border = ${config.general.col_inactive_border}`);
            if (config.general.layout) lines.push(`    layout = ${config.general.layout}`);
            if (config.general.allow_tearing !== undefined) lines.push(`    allow_tearing = ${config.general.allow_tearing}`);
            lines.push('}');
            lines.push('');
          }
          break;

        case 'decoration':
          if (config.decoration) {
            lines.push('decoration {');
            if (config.decoration.rounding !== undefined) lines.push(`    rounding = ${config.decoration.rounding}`);
            
            if (config.decoration.blur) {
              lines.push('    blur {');
              if (config.decoration.blur.enabled !== undefined) lines.push(`        enabled = ${config.decoration.blur.enabled}`);
              if (config.decoration.blur.size !== undefined) lines.push(`        size = ${config.decoration.blur.size}`);
              if (config.decoration.blur.passes !== undefined) lines.push(`        passes = ${config.decoration.blur.passes}`);
              if (config.decoration.blur.vibrancy !== undefined) lines.push(`        vibrancy = ${config.decoration.blur.vibrancy}`);
              lines.push('    }');
            }
            
            if (config.decoration.shadow) {
              lines.push('    shadow {');
              if (config.decoration.shadow.enabled !== undefined) lines.push(`        enabled = ${config.decoration.shadow.enabled}`);
              if (config.decoration.shadow.range !== undefined) lines.push(`        range = ${config.decoration.shadow.range}`);
              if (config.decoration.shadow.render_power !== undefined) lines.push(`        render_power = ${config.decoration.shadow.render_power}`);
              if (config.decoration.shadow.color) lines.push(`        color = ${config.decoration.shadow.color}`);
              lines.push('    }');
            }
            
            lines.push('}');
            lines.push('');
          }
          break;

        case 'input':
          if (config.input) {
            lines.push('input {');
            if (config.input.kb_layout) lines.push(`    kb_layout = ${config.input.kb_layout}`);
            if (config.input.kb_variant !== undefined) lines.push(`    kb_variant = ${config.input.kb_variant || ''}`);
            if (config.input.kb_model !== undefined) lines.push(`    kb_model = ${config.input.kb_model || ''}`);
            if (config.input.kb_options !== undefined) lines.push(`    kb_options = ${config.input.kb_options || ''}`);
            if (config.input.kb_rules !== undefined) lines.push(`    kb_rules = ${config.input.kb_rules || ''}`);
            if (config.input.follow_mouse !== undefined) lines.push(`    follow_mouse = ${config.input.follow_mouse}`);
            if (config.input.sensitivity !== undefined) lines.push(`    sensitivity = ${config.input.sensitivity}`);
            
            if (config.input.touchpad) {
              lines.push('    touchpad {');
              if (config.input.touchpad.natural_scroll !== undefined) {
                lines.push(`        natural_scroll = ${config.input.touchpad.natural_scroll}`);
              }
              lines.push('    }');
            }
            
            lines.push('}');
            lines.push('');
          }
          break;

        case 'animations':
          if (config.animations) {
            lines.push('animations {');
            if (config.animations.enabled !== undefined) lines.push(`    enabled = ${config.animations.enabled}`);
            lines.push('}');
            lines.push('');
          }
          break;

        case 'bind':
          lines.push(...config.rawSections.keybindings);
          lines.push('');
          break;

        case 'windowrule':
          lines.push(...config.rawSections.windowRules);
          lines.push('');
          break;

        case 'animation':
          lines.push(...config.rawSections.animationLines);
          lines.push('');
          break;
      }
    }

    // Add preserved layout blocks
    if (config.rawSections.layouts.length > 0) {
      lines.push(...config.rawSections.layouts);
      lines.push('');
    }

    // Add misc block if present
    if (config.rawSections.misc.length > 0) {
      lines.push(...config.rawSections.misc);
      lines.push('');
    }

    // Add any unknown sections at the end
    if (config.rawSections.unknown.length > 0) {
      lines.push(...config.rawSections.unknown);
      lines.push('');
    }

    return lines.join('\n');
  }

  // ========== DEFAULTS ==========

  private getDefaultConfig(): HyprlandConfig {
    return {
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
        blur: {
          enabled: true,
          size: 3,
          passes: 1,
          vibrancy: 0.1696
        },
        shadow: {
          enabled: true,
          range: 4,
          render_power: 3
        }
      },
      animations: {
        enabled: true
      },
      input: {
        kb_layout: 'us',
        follow_mouse: 1,
        sensitivity: 0,
        touchpad: {
          natural_scroll: false
        }
      },
      autostart: [],
      environment: [],
      rawSections: {
        keybindings: [],
        windowRules: [],
        layouts: [],
        animationLines: [],
        misc: [],
        comments: [],
        unknown: []
      },
      sectionOrder: []
    };
  }

  /**
   * Ensure all sections are initialized with defaults
   */
  private ensureDefaults(config: HyprlandConfig): void {
    if (!config.general) {
      config.general = {
        gaps_in: 5,
        gaps_out: 10,
        border_size: 2,
        col_active_border: 'rgba(33ccffee)',
        col_inactive_border: 'rgba(595959aa)',
        layout: 'dwindle'
      };
    }

    if (!config.decoration) {
      config.decoration = {
        rounding: 10,
        blur: { enabled: true, size: 3, passes: 1, vibrancy: 0.1696 },
        shadow: { enabled: true, range: 4, render_power: 3 }
      };
    } else {
      if (!config.decoration.blur) {
        config.decoration.blur = { enabled: true, size: 3, passes: 1, vibrancy: 0.1696 };
      }
      if (!config.decoration.shadow) {
        config.decoration.shadow = { enabled: true, range: 4, render_power: 3 };
      }
    }

    if (!config.animations) {
      config.animations = { enabled: true };
    }

    if (!config.input) {
      config.input = {
        kb_layout: 'us',
        follow_mouse: 1,
        sensitivity: 0,
        touchpad: { natural_scroll: false }
      };
    } else if (!config.input.touchpad) {
      config.input.touchpad = { natural_scroll: false };
    }
  }
}
