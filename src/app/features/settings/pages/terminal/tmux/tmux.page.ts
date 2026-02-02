import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TmuxService } from '@core/services/config/terminal/tmux.service';

@Component({
  selector: 'app-tmux-config',
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
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './tmux.page.html',
  styleUrl: './tmux.page.scss'
})
export class TmuxPageComponent implements OnInit {
  private tmuxService = inject(TmuxService);
  private snackBar = inject(MatSnackBar);

  // Expose service signals
  config = this.tmuxService.config;
  isLoading = this.tmuxService.isLoading;
  hasUnsavedChanges = this.tmuxService.hasUnsavedChanges;
  error = this.tmuxService.error;
  configPath = this.tmuxService.configPath;
  configExists = this.tmuxService.configExists;
  backups = this.tmuxService.backups;

  // Options
  statusPositions = ['top', 'bottom'];

  ngOnInit() {
    // Config is loaded in service constructor
  }

  async saveConfig(): Promise<void> {
    try {
      await this.tmuxService.saveConfig();
    } catch {
      // Error handling is in service
    }
  }

  resetConfig(): void {
    this.tmuxService.resetConfig();
  }

  onConfigChange(): void {
    const currentConfig = this.config();
    if (currentConfig) {
      this.tmuxService.updateConfig(() => ({ ...currentConfig }));
    }
  }

  async createDefaultConfig(): Promise<void> {
    await this.tmuxService.createDefaultConfig();
  }

  async createBackup(): Promise<void> {
    await this.tmuxService.createBackup();
  }

  async restoreBackup(path: string): Promise<void> {
    await this.tmuxService.restoreBackup(path);
  }

  async deleteBackup(path: string): Promise<void> {
    await this.tmuxService.deleteBackup(path);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  addKeybinding(): void {
    this.tmuxService.addKeybinding({
      key: '',
      command: ''
    });
  }

  removeKeybinding(index: number): void {
    this.tmuxService.removeKeybinding(index);
  }
}
