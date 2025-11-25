import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

interface HyprlandConfig {
  monitors: MonitorConfig[];
  general: GeneralConfig;
  decoration: DecorationConfig;
  animations: AnimationsConfig;
  input: InputConfig;
  autostart: AutostartApp[];
  environment: EnvironmentVar[];
}

interface MonitorConfig {
  name: string;
  resolution: string;
  refreshRate: number;
  position: { x: number; y: number };
  scale: number;
}

interface GeneralConfig {
  gaps_in: number;
  gaps_out: number;
  border_size: number;
  col_active_border: string;
  col_inactive_border: string;
  layout: 'dwindle' | 'master';
}

interface DecorationConfig {
  rounding: number;
  blur_enabled: boolean;
  blur_size: number;
  blur_passes: number;
  shadow_enabled: boolean;
  shadow_range: number;
}

interface AnimationsConfig {
  enabled: boolean;
  speed: number;
}

interface InputConfig {
  kb_layout: string;
  follow_mouse: boolean;
  sensitivity: number;
  natural_scroll: boolean;
}

interface AutostartApp {
  command: string;
  workspace?: number;
  silent?: boolean;
}

interface EnvironmentVar {
  key: string;
  value: string;
}

@Component({
  selector: 'app-hyprland-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatTabsModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './hyprland.page.html',
  styleUrl: './hyprland.page.scss'
})
export class HyprlandPageComponent implements OnInit {
  config = signal<HyprlandConfig>({
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
      shadow_enabled: true,
      shadow_range: 4
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
    autostart: [
      { command: '/usr/bin/argus', workspace: 1, silent: true },
      { command: 'waybar' },
      { command: 'dunst' },
      { command: 'google-chrome-stable', workspace: 2, silent: true },
      { command: 'cursor', workspace: 3, silent: true },
      { command: 'kitty', workspace: 4, silent: true }
    ],
    environment: [
      { key: 'XCURSOR_SIZE', value: '24' },
      { key: 'WLR_NO_HARDWARE_CURSORS', value: '1' }
    ]
  });

  hasUnsavedChanges = signal(false);

  layouts = ['dwindle', 'master'];
  keyboardLayouts = ['us', 'gb', 'de', 'fr', 'es', 'it'];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // TODO: Load config from Tauri backend
    this.loadConfig();
  }

  loadConfig(): void {
    // Placeholder - will integrate with Tauri to read hyprland.conf
    console.log('Loading Hyprland config...');
  }

  saveConfig(): void {
    // TODO: Save config via Tauri backend
    this.hasUnsavedChanges.set(false);
    this.snackBar.open('Configuration saved successfully!', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  resetConfig(): void {
    this.loadConfig();
    this.hasUnsavedChanges.set(false);
    this.snackBar.open('Configuration reset to saved values', 'Close', {
      duration: 3000
    });
  }

  onConfigChange(): void {
    this.hasUnsavedChanges.set(true);
  }

  addMonitor(): void {
    const current = this.config();
    current.monitors.push({
      name: 'HDMI-A-2',
      resolution: '1920x1080',
      refreshRate: 60,
      position: { x: 0, y: 0 },
      scale: 1
    });
    this.config.set(current);
    this.onConfigChange();
  }

  removeMonitor(index: number): void {
    const current = this.config();
    current.monitors.splice(index, 1);
    this.config.set(current);
    this.onConfigChange();
  }

  addAutostartApp(): void {
    const current = this.config();
    current.autostart.push({ command: '' });
    this.config.set(current);
    this.onConfigChange();
  }

  removeAutostartApp(index: number): void {
    const current = this.config();
    current.autostart.splice(index, 1);
    this.config.set(current);
    this.onConfigChange();
  }

  addEnvironmentVar(): void {
    const current = this.config();
    current.environment.push({ key: '', value: '' });
    this.config.set(current);
    this.onConfigChange();
  }

  removeEnvironmentVar(index: number): void {
    const current = this.config();
    current.environment.splice(index, 1);
    this.config.set(current);
    this.onConfigChange();
  }

  formatLabel(value: number): string {
    return `${value}`;
  }
}

