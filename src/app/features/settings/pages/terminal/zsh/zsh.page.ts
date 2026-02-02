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
import { MatExpansionModule } from '@angular/material/expansion';
import { ZshService } from '@core/services/config/terminal/zsh.service';
import { ZSH_OPTIONS } from '@core/models/terminal/zsh.model';
import { AliasEditorComponent } from '../../../components/terminal/alias-editor/alias-editor.component';
import { EnvEditorComponent } from '../../../components/terminal/env-editor/env-editor.component';

@Component({
  selector: 'app-zsh-config',
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
    MatExpansionModule,
    AliasEditorComponent,
    EnvEditorComponent
  ],
  templateUrl: './zsh.page.html',
  styleUrl: './zsh.page.scss'
})
export class ZshPageComponent implements OnInit {
  private zshService = inject(ZshService);
  private snackBar = inject(MatSnackBar);

  // Expose service signals
  config = this.zshService.config;
  isLoading = this.zshService.isLoading;
  hasUnsavedChanges = this.zshService.hasUnsavedChanges;
  error = this.zshService.error;
  configPath = this.zshService.configPath;
  configExists = this.zshService.configExists;
  backups = this.zshService.backups;

  // Options
  zshOptions = ZSH_OPTIONS;
  autosuggestionStrategies = ['history', 'completion', 'match_prev_cmd'];

  ngOnInit() {
    // Config is loaded in service constructor
  }

  async saveConfig(): Promise<void> {
    try {
      await this.zshService.saveConfig();
    } catch {
      // Error handling is in service
    }
  }

  resetConfig(): void {
    this.zshService.resetConfig();
  }

  onConfigChange(): void {
    const currentConfig = this.config();
    if (currentConfig) {
      this.zshService.updateConfig(() => ({ ...currentConfig }));
    }
  }

  async createDefaultConfig(): Promise<void> {
    await this.zshService.createDefaultConfig();
  }

  async createBackup(): Promise<void> {
    await this.zshService.createBackup();
  }

  async restoreBackup(path: string): Promise<void> {
    await this.zshService.restoreBackup(path);
  }

  async deleteBackup(path: string): Promise<void> {
    await this.zshService.deleteBackup(path);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  isOptionEnabled(option: string): boolean {
    return this.config()?.options.includes(option) ?? false;
  }

  toggleOption(option: string): void {
    this.zshService.toggleOption(option);
  }

  isHistoryOptionEnabled(option: string): boolean {
    return this.config()?.history.options.includes(option) ?? false;
  }

  toggleHistoryOption(option: string): void {
    const cfg = this.config();
    if (cfg) {
      if (cfg.history.options.includes(option)) {
        cfg.history.options = cfg.history.options.filter(o => o !== option);
      } else {
        cfg.history.options = [...cfg.history.options, option];
      }
      this.onConfigChange();
    }
  }

  togglePlugin(index: number): void {
    this.zshService.togglePlugin(index);
  }

  addPlugin(): void {
    this.zshService.addPlugin({
      name: '',
      path: '',
      enabled: true
    });
  }

  removePlugin(index: number): void {
    this.zshService.removePlugin(index);
  }

  addKeybinding(): void {
    this.zshService.addKeybinding({
      key: '',
      widget: ''
    });
  }

  removeKeybinding(index: number): void {
    this.zshService.removeKeybinding(index);
  }
}
