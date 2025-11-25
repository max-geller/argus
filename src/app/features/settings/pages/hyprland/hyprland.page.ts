import { Component, computed, inject } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HyprlandService } from '@core/services/config/hyprland.service';

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
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './hyprland.page.html',
  styleUrl: './hyprland.page.scss'
})
export class HyprlandPageComponent {
  private hyprlandService = inject(HyprlandService);
  private snackBar = inject(MatSnackBar);

  // Expose service signals
  config = this.hyprlandService.config;
  isLoading = this.hyprlandService.isLoading;
  hasUnsavedChanges = this.hyprlandService.hasUnsavedChanges;
  error = this.hyprlandService.error;

  // Options for dropdowns
  layouts = ['dwindle', 'master'];
  keyboardLayouts = ['us', 'gb', 'de', 'fr', 'es', 'it'];

  async saveConfig(): Promise<void> {
    try {
      await this.hyprlandService.saveConfig();
      this.snackBar.open('Configuration saved successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
    } catch (error) {
      this.snackBar.open('Failed to save configuration', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
    }
  }

  async resetConfig(): Promise<void> {
    await this.hyprlandService.resetConfig();
    this.snackBar.open('Configuration reset to saved values', 'Close', {
      duration: 3000
    });
  }

  onConfigChange(): void {
    this.hyprlandService.hasUnsavedChanges.set(true);
  }

  addMonitor(): void {
    this.hyprlandService.updateConfig(config => ({
      ...config,
      monitors: [
        ...config.monitors,
        {
          name: 'HDMI-A-2',
          resolution: '1920x1080',
          refreshRate: 60,
          position: { x: 0, y: 0 },
          scale: 1
        }
      ]
    }));
  }

  removeMonitor(index: number): void {
    this.hyprlandService.updateConfig(config => ({
      ...config,
      monitors: config.monitors.filter((_, i) => i !== index)
    }));
  }

  addAutostartApp(): void {
    this.hyprlandService.updateConfig(config => ({
      ...config,
      autostart: [...config.autostart, { command: '' }]
    }));
  }

  removeAutostartApp(index: number): void {
    this.hyprlandService.updateConfig(config => ({
      ...config,
      autostart: config.autostart.filter((_, i) => i !== index)
    }));
  }

  addEnvironmentVar(): void {
    this.hyprlandService.updateConfig(config => ({
      ...config,
      environment: [...config.environment, { key: '', value: '' }]
    }));
  }

  removeEnvironmentVar(index: number): void {
    this.hyprlandService.updateConfig(config => ({
      ...config,
      environment: config.environment.filter((_, i) => i !== index)
    }));
  }

  formatLabel(value: number): string {
    return `${value}`;
  }
}
