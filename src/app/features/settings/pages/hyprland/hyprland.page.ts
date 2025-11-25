import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HyprlandService } from '@core/services/config/hyprland.service';
import { SnapshotService } from '@core/services/snapshot.service';

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
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './hyprland.page.html',
  styleUrl: './hyprland.page.scss'
})
export class HyprlandPageComponent implements OnInit {
  private hyprlandService = inject(HyprlandService);
  private snapshotService = inject(SnapshotService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Expose service signals
  config = this.hyprlandService.config;
  isLoading = this.hyprlandService.isLoading;
  hasUnsavedChanges = this.hyprlandService.hasUnsavedChanges;
  error = this.hyprlandService.error;
  snapshots = this.snapshotService.snapshots;

  // Options for dropdowns
  layouts = ['dwindle', 'master'];
  keyboardLayouts = ['us', 'gb', 'de', 'fr', 'es', 'it'];

  async ngOnInit() {
    // Load snapshots
    await this.hyprlandService.listSnapshots();
  }

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
    this.hyprlandService.resetConfig();
    this.snackBar.open('Configuration reset to saved values', 'Close', {
      duration: 3000
    });
  }

  onConfigChange(): void {
    // Force the config signal to update by creating a new reference
    // This ensures the computed signal detects the change
    const currentConfig = this.config();
    if (currentConfig) {
      this.hyprlandService.updateConfig(() => ({ ...currentConfig }));
    }
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

  async createSnapshot(): Promise<void> {
    const description = prompt('Enter a description for this snapshot:');
    if (!description) return;

    try {
      await this.hyprlandService.createSnapshot(description);
      this.snackBar.open('Snapshot created successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to create snapshot', 'Close', { duration: 5000 });
    }
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to restore this snapshot? Any unsaved changes will be lost.');
    if (!confirmed) return;

    try {
      await this.hyprlandService.restoreSnapshot(snapshotId);
      this.snackBar.open('Snapshot restored successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to restore snapshot', 'Close', { duration: 5000 });
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this snapshot?');
    if (!confirmed) return;

    try {
      await this.hyprlandService.deleteSnapshot(snapshotId);
      this.snackBar.open('Snapshot deleted', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to delete snapshot', 'Close', { duration: 5000 });
    }
  }

  /**
   * Check if a value is set in the config (not just using defaults)
   */
  isValueSet(value: any): boolean {
    return value !== undefined && value !== null;
  }

  /**
   * Get a placeholder text for unset values
   */
  getPlaceholder(defaultValue: any): string {
    return `Not set (default: ${defaultValue})`;
  }
}
