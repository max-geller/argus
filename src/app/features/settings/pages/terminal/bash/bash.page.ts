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
import { MatChipsModule } from '@angular/material/chips';
import { BashService } from '@core/services/config/terminal/bash.service';
import { BASH_SHOPT_OPTIONS } from '@core/models/terminal/bash.model';
import { AliasEditorComponent } from '../../../components/terminal/alias-editor/alias-editor.component';
import { EnvEditorComponent } from '../../../components/terminal/env-editor/env-editor.component';

@Component({
  selector: 'app-bash-config',
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
    MatProgressSpinnerModule,
    MatChipsModule,
    AliasEditorComponent,
    EnvEditorComponent
  ],
  templateUrl: './bash.page.html',
  styleUrl: './bash.page.scss'
})
export class BashPageComponent implements OnInit {
  private bashService = inject(BashService);
  private snackBar = inject(MatSnackBar);

  // Expose service signals
  config = this.bashService.config;
  isLoading = this.bashService.isLoading;
  hasUnsavedChanges = this.bashService.hasUnsavedChanges;
  error = this.bashService.error;
  configPath = this.bashService.configPath;
  configExists = this.bashService.configExists;
  backups = this.bashService.backups;

  // Options
  shoptOptions = BASH_SHOPT_OPTIONS;

  ngOnInit() {
    // Config is loaded in service constructor
  }

  async saveConfig(): Promise<void> {
    try {
      await this.bashService.saveConfig();
    } catch {
      // Error handling is in service
    }
  }

  resetConfig(): void {
    this.bashService.resetConfig();
  }

  onConfigChange(): void {
    const currentConfig = this.config();
    if (currentConfig) {
      this.bashService.updateConfig(() => ({ ...currentConfig }));
    }
  }

  async createDefaultConfig(): Promise<void> {
    await this.bashService.createDefaultConfig();
  }

  async createBackup(): Promise<void> {
    await this.bashService.createBackup();
  }

  async restoreBackup(path: string): Promise<void> {
    await this.bashService.restoreBackup(path);
  }

  async deleteBackup(path: string): Promise<void> {
    await this.bashService.deleteBackup(path);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  isShoptEnabled(option: string): boolean {
    return this.config()?.shopOptions.includes(option) ?? false;
  }

  toggleShopt(option: string): void {
    this.bashService.toggleShopt(option);
  }

  addPathEntry(): void {
    const cfg = this.config();
    if (cfg) {
      cfg.pathAdditions = [...cfg.pathAdditions, ''];
      this.onConfigChange();
    }
  }

  removePathEntry(index: number): void {
    this.bashService.removePathEntry(index);
  }

  addSource(): void {
    const cfg = this.config();
    if (cfg) {
      cfg.sources = [...cfg.sources, ''];
      this.onConfigChange();
    }
  }

  removeSource(index: number): void {
    this.bashService.removeSource(index);
  }

  addStartupCommand(): void {
    const cfg = this.config();
    if (cfg) {
      cfg.startupCommands = [...cfg.startupCommands, ''];
      this.onConfigChange();
    }
  }

  removeStartupCommand(index: number): void {
    const cfg = this.config();
    if (cfg) {
      cfg.startupCommands = cfg.startupCommands.filter((_, i) => i !== index);
      this.onConfigChange();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
