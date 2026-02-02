import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

import { ThemeService } from '@core/services/theme/theme.service';
import { ThemeApplicationService } from '@core/services/theme/theme-application.service';
import {
  Theme,
  ThemePalette,
  ThemeVariant,
  createDefaultTheme,
  createDefaultPalette,
  MONTH_NAMES,
} from '@core/models/theme';

@Component({
  selector: 'app-theme-editor',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="editor-page">
      <header class="page-header">
        <div class="header-content">
          <button mat-icon-button routerLink="../gallery">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ isNewTheme() ? 'Create Theme' : 'Edit Theme' }}</h1>
            <p class="subtitle">
              @if (theme(); as t) {
                {{ t.name || 'Untitled Theme' }}
              }
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button (click)="previewTheme()">
            <mat-icon>visibility</mat-icon>
            Preview
          </button>
          <button
            mat-raised-button
            color="primary"
            [disabled]="!hasChanges() || isSaving()"
            (click)="saveTheme()"
          >
            @if (isSaving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Save Theme
          </button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading theme...</p>
        </div>
      }

      @if (!isLoading() && theme(); as t) {
        <div class="editor-content">
          <!-- Basic Info -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>Basic Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Theme ID</mat-label>
                  <input
                    matInput
                    [(ngModel)]="t.id"
                    [disabled]="!isNewTheme()"
                    (ngModelChange)="markDirty()"
                  >
                  <mat-hint>Unique identifier (lowercase, no spaces)</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Theme Name</mat-label>
                  <input
                    matInput
                    [(ngModel)]="t.name"
                    (ngModelChange)="markDirty()"
                  >
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="t.description"
                    rows="3"
                    (ngModelChange)="markDirty()"
                  ></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Author</mat-label>
                  <input
                    matInput
                    [(ngModel)]="t.author"
                    (ngModelChange)="markDirty()"
                  >
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Version</mat-label>
                  <input
                    matInput
                    [(ngModel)]="t.version"
                    (ngModelChange)="markDirty()"
                  >
                </mat-form-field>
              </div>

              <div class="theme-type">
                <mat-form-field appearance="outline">
                  <mat-label>Associated Month</mat-label>
                  <mat-select [(ngModel)]="t.month" (selectionChange)="markDirty()">
                    <mat-option [value]="undefined">None (Custom Theme)</mat-option>
                    @for (month of months; track month.value) {
                      <mat-option [value]="month.value">{{ month.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-slide-toggle
                  [(ngModel)]="t.isHoliday"
                  (change)="markDirty()"
                >
                  Holiday Theme
                </mat-slide-toggle>
              </div>

              <div class="tags-section">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tags</mat-label>
                  <mat-chip-grid #chipGrid>
                    @for (tag of t.tags || []; track tag) {
                      <mat-chip-row (removed)="removeTag(tag)">
                        {{ tag }}
                        <button matChipRemove>
                          <mat-icon>cancel</mat-icon>
                        </button>
                      </mat-chip-row>
                    }
                    <input
                      placeholder="Add tag..."
                      [matChipInputFor]="chipGrid"
                      [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                      (matChipInputTokenEnd)="addTag($event)"
                    >
                  </mat-chip-grid>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Variant Tabs -->
          <mat-card class="variants-card">
            <mat-tab-group>
              <!-- Day Variant -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>light_mode</mat-icon>
                  Day Variant
                </ng-template>
                <ng-template matTabContent>
                  <div class="variant-content">
                    <ng-container
                      *ngTemplateOutlet="variantEditor; context: { variant: t.variants.day, variantName: 'day' }"
                    ></ng-container>
                  </div>
                </ng-template>
              </mat-tab>

              <!-- Night Variant -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>dark_mode</mat-icon>
                  Night Variant
                </ng-template>
                <ng-template matTabContent>
                  <div class="variant-content">
                    @if (!t.variants.night) {
                      <div class="no-variant">
                        <p>No night variant configured. Click to create one.</p>
                        <button mat-raised-button (click)="createNightVariant()">
                          <mat-icon>add</mat-icon>
                          Create Night Variant
                        </button>
                      </div>
                    } @else {
                      <ng-container
                        *ngTemplateOutlet="variantEditor; context: { variant: t.variants.night, variantName: 'night' }"
                      ></ng-container>
                      <button mat-button color="warn" (click)="removeNightVariant()">
                        <mat-icon>delete</mat-icon>
                        Remove Night Variant
                      </button>
                    }
                  </div>
                </ng-template>
              </mat-tab>
            </mat-tab-group>
          </mat-card>

          <!-- Preview Panel -->
          @if (previewConfigs()) {
            <mat-card class="preview-card">
              <mat-card-header>
                <mat-card-title>Generated Configs Preview</mat-card-title>
                <button mat-icon-button (click)="closePreview()">
                  <mat-icon>close</mat-icon>
                </button>
              </mat-card-header>
              <mat-card-content>
                <mat-tab-group>
                  <mat-tab label="Hyprland">
                    <pre class="config-preview">{{ previewConfigs()!.hyprland }}</pre>
                  </mat-tab>
                  <mat-tab label="Waybar CSS">
                    <pre class="config-preview">{{ previewConfigs()!.waybar_css }}</pre>
                  </mat-tab>
                  <mat-tab label="Kitty">
                    <pre class="config-preview">{{ previewConfigs()!.kitty }}</pre>
                  </mat-tab>
                  <mat-tab label="Starship">
                    <pre class="config-preview">{{ previewConfigs()!.starship }}</pre>
                  </mat-tab>
                  <mat-tab label="Rofi">
                    <pre class="config-preview">{{ previewConfigs()!.rofi }}</pre>
                  </mat-tab>
                </mat-tab-group>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Variant Editor Template -->
        <ng-template #variantEditor let-variant="variant" let-variantName="variantName">
          <div class="variant-editor">
            <!-- Wallpaper -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Wallpaper Path</mat-label>
              <input
                matInput
                [ngModel]="variant.wallpaper"
                (ngModelChange)="updateVariantWallpaper(variantName, $event)"
              >
              <button
                mat-icon-button
                matSuffix
                matTooltip="Browse for image"
                (click)="browseForWallpaper(variantName)"
              >
                <mat-icon>image</mat-icon>
              </button>
              <mat-hint>Full path to wallpaper image (click icon to browse)</mat-hint>
            </mat-form-field>

            @if (variant.wallpaper) {
              <div
                class="wallpaper-preview"
                [style.backgroundImage]="'url(' + variant.wallpaper + ')'"
              ></div>
            }

            <!-- Palette Colors -->
            <mat-expansion-panel expanded>
              <mat-expansion-panel-header>
                <mat-panel-title>Color Palette</mat-panel-title>
              </mat-expansion-panel-header>

              <div class="color-grid">
                @for (colorKey of paletteKeys; track colorKey) {
                  <div class="color-field">
                    <label>{{ formatColorName(colorKey) }}</label>
                    <div class="color-input">
                      <input
                        type="color"
                        [value]="variant.palette[colorKey]"
                        (input)="updatePaletteColor(variantName, colorKey, $event)"
                      >
                      <input
                        type="text"
                        [value]="variant.palette[colorKey]"
                        (input)="updatePaletteColorText(variantName, colorKey, $event)"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      >
                    </div>
                  </div>
                }
              </div>

              <div class="palette-actions">
                <button mat-button (click)="resetPalette(variantName)">
                  <mat-icon>refresh</mat-icon>
                  Reset to Default
                </button>
                @if (variantName === 'night' && t.variants.day) {
                  <button mat-button (click)="copyFromDay()">
                    <mat-icon>content_copy</mat-icon>
                    Copy from Day
                  </button>
                }
              </div>
            </mat-expansion-panel>

            <!-- Live Preview -->
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>Live Preview</mat-panel-title>
              </mat-expansion-panel-header>

              <div class="live-preview" [style]="getPreviewStyles(variant.palette)">
                <div class="preview-bar">
                  <span class="workspaces">
                    <span class="ws active">1</span>
                    <span class="ws">2</span>
                    <span class="ws">3</span>
                  </span>
                  <span class="clock">12:34</span>
                </div>
                <div class="preview-window">
                  <div class="window-header">Terminal</div>
                  <div class="window-content">
                    <span class="prompt">$</span> echo "Hello, World!"
                    <br>
                    Hello, World!
                  </div>
                </div>
                <div class="preview-card">
                  <h4>Card Title</h4>
                  <p>This is how cards will look.</p>
                  <button>Primary Button</button>
                </div>
              </div>
            </mat-expansion-panel>
          </div>
        </ng-template>
      }
    </div>
  `,
  styles: [`
    .editor-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 500;
        }

        .subtitle {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: var(--mdc-theme-text-secondary-on-background);
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px;
      gap: 16px;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .full-width {
        grid-column: 1 / -1;
      }
    }

    .theme-type {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-top: 16px;
    }

    .tags-section {
      margin-top: 16px;
    }

    .variant-content {
      padding: 24px;
    }

    .no-variant {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      text-align: center;
    }

    .variant-editor {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .wallpaper-preview {
      height: 150px;
      background-size: cover;
      background-position: center;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }

    .color-field {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.85rem;
        font-weight: 500;
      }

      .color-input {
        display: flex;
        gap: 8px;
        align-items: center;

        input[type="color"] {
          width: 40px;
          height: 40px;
          padding: 0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        input[type="text"] {
          flex: 1;
          padding: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          background: rgba(0,0,0,0.2);
          color: inherit;
          font-family: monospace;
        }
      }
    }

    .palette-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .live-preview {
      padding: 16px;
      border-radius: 8px;
      font-family: system-ui;

      .preview-bar {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        margin-bottom: 16px;
        border-radius: 4px;

        .workspaces {
          display: flex;
          gap: 8px;

          .ws {
            padding: 4px 12px;
            border-radius: 4px;
          }
        }
      }

      .preview-window {
        border-radius: 8px;
        margin-bottom: 16px;
        overflow: hidden;

        .window-header {
          padding: 8px 12px;
          font-weight: 500;
        }

        .window-content {
          padding: 12px;
          font-family: monospace;
          font-size: 0.9rem;

          .prompt {
            font-weight: bold;
          }
        }
      }

      .preview-card {
        padding: 16px;
        border-radius: 8px;

        h4 {
          margin: 0 0 8px;
        }

        p {
          margin: 0 0 12px;
          opacity: 0.8;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
      }
    }

    .preview-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .config-preview {
      padding: 16px;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
    }
  `],
})
export class EditorPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private applicationService = inject(ThemeApplicationService);
  private snackBar = inject(MatSnackBar);

  // State
  theme = signal<Theme | null>(null);
  isNewTheme = signal(true);
  isLoading = signal(false);
  isSaving = signal(false);
  isDirty = signal(false);
  previewConfigs = this.applicationService.previewConfigs;

  // Computed
  hasChanges = computed(() => this.isDirty());

  // Constants
  separatorKeyCodes = [ENTER, COMMA];
  paletteKeys: (keyof ThemePalette)[] = [
    'base', 'mantle', 'crust',
    'surface0', 'surface1', 'surface2',
    'text', 'subtext0', 'subtext1',
    'accent', 'secondary',
    'red', 'green', 'yellow', 'blue', 'pink', 'teal'
  ];

  months = MONTH_NAMES.map((name, i) => ({ value: i + 1, name }));

  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');

    if (id) {
      this.isLoading.set(true);
      this.isNewTheme.set(false);

      const loadedTheme = await this.themeService.getTheme(id);
      if (loadedTheme) {
        this.theme.set(loadedTheme);
      } else {
        this.snackBar.open('Theme not found', 'Dismiss', { duration: 3000 });
        this.router.navigate(['../gallery'], { relativeTo: this.route });
      }

      this.isLoading.set(false);
    } else {
      // Create new theme
      const newTheme = createDefaultTheme(
        `theme-${Date.now()}`,
        'New Theme'
      );
      this.theme.set(newTheme);
      this.isNewTheme.set(true);
    }
  }

  markDirty(): void {
    this.isDirty.set(true);
  }

  async saveTheme(): Promise<void> {
    const theme = this.theme();
    if (!theme) return;

    this.isSaving.set(true);

    const success = await this.themeService.saveTheme(theme);

    if (success) {
      this.isDirty.set(false);
      this.isNewTheme.set(false);
      this.snackBar.open('Theme saved successfully', 'Dismiss', {
        duration: 3000,
      });
    } else {
      this.snackBar.open(
        this.themeService.error() || 'Failed to save theme',
        'Dismiss',
        { duration: 5000 }
      );
    }

    this.isSaving.set(false);
  }

  async previewTheme(): Promise<void> {
    const theme = this.theme();
    if (!theme) return;

    // Need to save first if new
    if (this.isNewTheme()) {
      await this.saveTheme();
    }

    await this.applicationService.previewTheme(theme.id, 'day');
  }

  closePreview(): void {
    this.applicationService.clearPreview();
  }

  createNightVariant(): void {
    const theme = this.theme();
    if (!theme) return;

    const nightVariant: ThemeVariant = {
      wallpaper: '',
      palette: createDefaultPalette('night'),
    };

    this.theme.update(t => t ? {
      ...t,
      variants: { ...t.variants, night: nightVariant }
    } : t);

    this.markDirty();
  }

  removeNightVariant(): void {
    this.theme.update(t => t ? {
      ...t,
      variants: { ...t.variants, night: undefined }
    } : t);

    this.markDirty();
  }

  updateVariantWallpaper(variant: 'day' | 'night', path: string): void {
    this.theme.update(t => {
      if (!t) return t;

      if (variant === 'day') {
        return {
          ...t,
          variants: {
            ...t.variants,
            day: { ...t.variants.day, wallpaper: path }
          }
        };
      } else if (t.variants.night) {
        return {
          ...t,
          variants: {
            ...t.variants,
            night: { ...t.variants.night, wallpaper: path }
          }
        };
      }
      return t;
    });

    this.markDirty();
  }

  async browseForWallpaper(variant: 'day' | 'night'): Promise<void> {
    try {
      // Dynamically import Tauri dialog API
      const { open } = await import('@tauri-apps/plugin-dialog');

      const selected = await open({
        multiple: false,
        directory: false,
        title: 'Select Wallpaper Image',
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'],
          },
          {
            name: 'All Files',
            extensions: ['*'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        this.updateVariantWallpaper(variant, selected);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      this.snackBar.open('Failed to open file browser', 'Dismiss', {
        duration: 3000,
      });
    }
  }

  updatePaletteColor(variant: 'day' | 'night', key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setPaletteColor(variant, key as keyof ThemePalette, input.value);
  }

  updatePaletteColorText(variant: 'day' | 'night', key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (/^#[0-9A-Fa-f]{6}$/.test(input.value)) {
      this.setPaletteColor(variant, key as keyof ThemePalette, input.value);
    }
  }

  private setPaletteColor(variant: 'day' | 'night', key: keyof ThemePalette, value: string): void {
    this.theme.update(t => {
      if (!t) return t;

      if (variant === 'day') {
        return {
          ...t,
          variants: {
            ...t.variants,
            day: {
              ...t.variants.day,
              palette: { ...t.variants.day.palette, [key]: value }
            }
          }
        };
      } else if (t.variants.night) {
        return {
          ...t,
          variants: {
            ...t.variants,
            night: {
              ...t.variants.night,
              palette: { ...t.variants.night.palette, [key]: value }
            }
          }
        };
      }
      return t;
    });

    this.markDirty();
  }

  resetPalette(variant: 'day' | 'night'): void {
    const defaultPalette = createDefaultPalette(variant);

    this.theme.update(t => {
      if (!t) return t;

      if (variant === 'day') {
        return {
          ...t,
          variants: {
            ...t.variants,
            day: { ...t.variants.day, palette: defaultPalette }
          }
        };
      } else if (t.variants.night) {
        return {
          ...t,
          variants: {
            ...t.variants,
            night: { ...t.variants.night, palette: defaultPalette }
          }
        };
      }
      return t;
    });

    this.markDirty();
  }

  copyFromDay(): void {
    const theme = this.theme();
    if (!theme || !theme.variants.night) return;

    this.theme.update(t => t ? {
      ...t,
      variants: {
        ...t.variants,
        night: {
          ...t.variants.night!,
          palette: { ...t.variants.day.palette }
        }
      }
    } : t);

    this.markDirty();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) return;

    this.theme.update(t => t ? {
      ...t,
      tags: [...(t.tags || []), value]
    } : t);

    event.chipInput!.clear();
    this.markDirty();
  }

  removeTag(tag: string): void {
    this.theme.update(t => t ? {
      ...t,
      tags: (t.tags || []).filter(t => t !== tag)
    } : t);

    this.markDirty();
  }

  formatColorName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/(\d)/g, ' $1')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  getPreviewStyles(palette: ThemePalette): string {
    return `
      --bg: ${palette.base};
      --bar-bg: ${palette.mantle};
      --surface: ${palette.surface0};
      --surface-hover: ${palette.surface1};
      --text: ${palette.text};
      --text-muted: ${palette.subtext0};
      --accent: ${palette.accent};
      background-color: var(--bg);
      color: var(--text);
    `;
  }
}
