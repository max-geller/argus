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
import { KittyService } from '@core/services/config/terminal/kitty.service';
import { KeybindingListComponent } from '../../../components/terminal/keybinding-list/keybinding-list.component';

@Component({
  selector: 'app-kitty-config',
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
    KeybindingListComponent
  ],
  templateUrl: './kitty.page.html',
  styleUrl: './kitty.page.scss'
})
export class KittyPageComponent implements OnInit {
  private kittyService = inject(KittyService);
  private snackBar = inject(MatSnackBar);

  // Expose service signals
  config = this.kittyService.config;
  isLoading = this.kittyService.isLoading;
  hasUnsavedChanges = this.kittyService.hasUnsavedChanges;
  error = this.kittyService.error;
  configPath = this.kittyService.configPath;
  configExists = this.kittyService.configExists;
  backups = this.kittyService.backups;

  // Options for dropdowns
  cursorShapes = ['block', 'beam', 'underline'];
  tabBarStyles = ['fade', 'slant', 'separator', 'powerline', 'hidden'];
  tabBarEdges = ['top', 'bottom'];

  ngOnInit() {
    // Config is loaded in service constructor
  }

  async saveConfig(): Promise<void> {
    try {
      await this.kittyService.saveConfig();
    } catch {
      // Error handling is in service
    }
  }

  resetConfig(): void {
    this.kittyService.resetConfig();
  }

  onConfigChange(): void {
    const currentConfig = this.config();
    if (currentConfig) {
      this.kittyService.updateConfig(() => ({ ...currentConfig }));
    }
  }

  async createDefaultConfig(): Promise<void> {
    await this.kittyService.createDefaultConfig();
  }

  async createBackup(): Promise<void> {
    await this.kittyService.createBackup();
  }

  async restoreBackup(path: string): Promise<void> {
    await this.kittyService.restoreBackup(path);
  }

  async deleteBackup(path: string): Promise<void> {
    await this.kittyService.deleteBackup(path);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  addKeybinding(): void {
    const cfg = this.config();
    if (cfg) {
      cfg.keybindings = [...cfg.keybindings, { key: '', action: '' }];
      this.onConfigChange();
    }
  }

  removeKeybinding(index: number): void {
    const cfg = this.config();
    if (cfg) {
      cfg.keybindings = cfg.keybindings.filter((_, i) => i !== index);
      this.onConfigChange();
    }
  }
}
