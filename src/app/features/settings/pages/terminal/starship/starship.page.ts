import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { StarshipService } from '@core/services/config/terminal/starship.service';
import { STARSHIP_MODULES, getModuleSymbols } from '@core/models/terminal/starship.model';

@Component({
  selector: 'app-starship-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule
  ],
  templateUrl: './starship.page.html',
  styleUrl: './starship.page.scss'
})
export class StarshipPageComponent implements OnInit {
  private starshipService = inject(StarshipService);
  private snackBar = inject(MatSnackBar);

  // Expose service signals
  config = this.starshipService.config;
  isLoading = this.starshipService.isLoading;
  hasUnsavedChanges = this.starshipService.hasUnsavedChanges;
  error = this.starshipService.error;
  configPath = this.starshipService.configPath;
  configExists = this.starshipService.configExists;
  backups = this.starshipService.backups;

  // Module data
  moduleNames = STARSHIP_MODULES;
  moduleSymbols = getModuleSymbols();

  // For template access
  Object = Object;

  ngOnInit() {
    // Config is loaded in service constructor
  }

  async saveConfig(): Promise<void> {
    try {
      await this.starshipService.saveConfig();
    } catch {
      // Error handling is in service
    }
  }

  resetConfig(): void {
    this.starshipService.resetConfig();
  }

  onConfigChange(): void {
    const currentConfig = this.config();
    if (currentConfig) {
      this.starshipService.updateConfig(() => ({ ...currentConfig }));
    }
  }

  async createDefaultConfig(): Promise<void> {
    await this.starshipService.createDefaultConfig();
  }

  async createBackup(): Promise<void> {
    await this.starshipService.createBackup();
  }

  async restoreBackup(path: string): Promise<void> {
    await this.starshipService.restoreBackup(path);
  }

  async deleteBackup(path: string): Promise<void> {
    await this.starshipService.deleteBackup(path);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  isModuleDisabled(moduleName: string): boolean {
    return this.config()?.modules[moduleName]?.disabled ?? false;
  }

  toggleModule(moduleName: string): void {
    this.starshipService.toggleModule(moduleName);
  }

  getModuleSymbol(moduleName: string): string {
    return this.moduleSymbols[moduleName] || '';
  }

  getPaletteColors(): { name: string; value: string }[] {
    const cfg = this.config();
    if (!cfg || !cfg.palette || !cfg.palettes[cfg.palette]) {
      return [];
    }
    return Object.entries(cfg.palettes[cfg.palette]).map(([name, value]) => ({ name, value }));
  }

  updatePaletteColor(colorName: string, colorValue: string): void {
    const cfg = this.config();
    if (cfg && cfg.palette) {
      this.starshipService.updatePaletteColor(cfg.palette, colorName, colorValue);
    }
  }

  addPaletteColor(): void {
    const cfg = this.config();
    if (cfg && cfg.palette) {
      this.starshipService.updatePaletteColor(cfg.palette, 'new_color', '#ffffff');
    }
  }

  getModuleConfig(moduleName: string): Record<string, unknown> {
    return this.config()?.modules[moduleName] || {};
  }

  updateModuleConfig(moduleName: string, key: string, value: unknown): void {
    this.starshipService.updateModule(moduleName, { [key]: value });
  }
}
