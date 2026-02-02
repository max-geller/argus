import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ThemeService } from '@core/services/theme/theme.service';
import { ThemeApplicationService } from '@core/services/theme/theme-application.service';
import { ThemeMetadata, MONTH_NAMES } from '@core/models/theme';

@Component({
  selector: 'app-theme-gallery',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="gallery-page">
      <header class="page-header">
        <div class="header-content">
          <h1>Theme Gallery</h1>
          <p class="subtitle">Browse and apply themes for your desktop</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="../editor">
            <mat-icon>add</mat-icon>
            Create Theme
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Search themes</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Filter by type</mat-label>
          <mat-select [(value)]="filterType" (selectionChange)="onFilterChange()">
            <mat-option value="all">All Themes</mat-option>
            <mat-option value="monthly">Monthly</mat-option>
            <mat-option value="holiday">Holiday</mat-option>
            <mat-option value="custom">Custom</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading themes...</p>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && filteredThemes().length === 0) {
        <div class="empty-state">
          <mat-icon>palette</mat-icon>
          @if (themes().length === 0) {
            <h2>No themes yet</h2>
            <p>Create your first theme to get started</p>
            <button mat-raised-button color="primary" routerLink="../editor">
              <mat-icon>add</mat-icon>
              Create Theme
            </button>
          } @else {
            <h2>No themes match your filters</h2>
            <p>Try adjusting your search or filter criteria</p>
            <button mat-button (click)="clearFilters()">Clear Filters</button>
          }
        </div>
      }

      <!-- Theme Grid -->
      @if (!isLoading() && filteredThemes().length > 0) {
        <div class="theme-grid">
          @for (theme of filteredThemes(); track theme.id) {
            <mat-card class="theme-card" [class.active]="isActiveTheme(theme.id)">
              <!-- Wallpaper Preview -->
              <div
                class="wallpaper-preview"
                [style.backgroundImage]="'url(' + theme.dayWallpaper + ')'"
              >
                <div class="preview-overlay">
                  @if (isActiveTheme(theme.id)) {
                    <mat-chip class="active-chip" highlighted>
                      <mat-icon>check</mat-icon>
                      Active
                    </mat-chip>
                  }

                  <div class="preview-actions">
                    <button
                      mat-mini-fab
                      color="primary"
                      matTooltip="Apply Day"
                      (click)="applyTheme(theme.id, 'day')"
                      [disabled]="isApplying()"
                    >
                      <mat-icon>light_mode</mat-icon>
                    </button>
                    @if (theme.nightWallpaper) {
                      <button
                        mat-mini-fab
                        color="accent"
                        matTooltip="Apply Night"
                        (click)="applyTheme(theme.id, 'night')"
                        [disabled]="isApplying()"
                      >
                        <mat-icon>dark_mode</mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <!-- Accent Color Indicator -->
                <div
                  class="accent-indicator"
                  [style.backgroundColor]="theme.accentColor"
                ></div>
              </div>

              <mat-card-content>
                <h3 class="theme-name">{{ theme.name }}</h3>
                @if (theme.description) {
                  <p class="theme-description">{{ theme.description }}</p>
                }

                <div class="theme-meta">
                  @if (theme.month) {
                    <mat-chip>{{ getMonthName(theme.month) }}</mat-chip>
                  }
                  @if (theme.isHoliday) {
                    <mat-chip color="accent">
                      <mat-icon>celebration</mat-icon>
                      Holiday
                    </mat-chip>
                  }
                  @if (theme.author) {
                    <span class="author">by {{ theme.author }}</span>
                  }
                </div>

                @if (theme.tags && theme.tags.length > 0) {
                  <div class="theme-tags">
                    @for (tag of theme.tags.slice(0, 3); track tag) {
                      <mat-chip class="tag-chip">{{ tag }}</mat-chip>
                    }
                    @if (theme.tags.length > 3) {
                      <span class="more-tags">+{{ theme.tags.length - 3 }} more</span>
                    }
                  </div>
                }
              </mat-card-content>

              <mat-card-actions>
                <button mat-button routerLink="../editor" [queryParams]="{id: theme.id}">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-button (click)="duplicateTheme(theme)">
                  <mat-icon>content_copy</mat-icon>
                  Duplicate
                </button>
                <button
                  mat-button
                  color="warn"
                  (click)="deleteTheme(theme)"
                  [disabled]="isActiveTheme(theme.id)"
                >
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .gallery-page {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .header-content {
        h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 500;
        }

        .subtitle {
          margin: 8px 0 0;
          color: var(--mdc-theme-text-secondary-on-background, rgba(255,255,255,0.7));
        }
      }
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;

      mat-form-field {
        min-width: 200px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      gap: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      gap: 16px;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--mdc-theme-text-secondary-on-background);
      }

      h2 {
        margin: 0;
      }

      p {
        margin: 0;
        color: var(--mdc-theme-text-secondary-on-background);
      }
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .theme-card {
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      }

      &.active {
        border: 2px solid var(--mdc-theme-primary);
      }

      .wallpaper-preview {
        height: 180px;
        background-size: cover;
        background-position: center;
        position: relative;
        overflow: hidden;

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.1) 0%,
            rgba(0,0,0,0.5) 100%
          );
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        &:hover .preview-overlay {
          opacity: 1;
        }

        .active-chip {
          align-self: flex-start;
        }

        .preview-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .accent-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
        }
      }

      mat-card-content {
        padding: 16px;

        .theme-name {
          margin: 0 0 8px;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .theme-description {
          margin: 0 0 12px;
          font-size: 0.9rem;
          color: var(--mdc-theme-text-secondary-on-background);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .theme-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;

          .author {
            font-size: 0.85rem;
            color: var(--mdc-theme-text-secondary-on-background);
          }
        }

        .theme-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          align-items: center;

          .tag-chip {
            font-size: 0.75rem;
          }

          .more-tags {
            font-size: 0.75rem;
            color: var(--mdc-theme-text-secondary-on-background);
          }
        }
      }

      mat-card-actions {
        display: flex;
        flex-wrap: wrap;
        padding: 8px;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
    }
  `],
})
export class GalleryPageComponent implements OnInit {
  private themeService = inject(ThemeService);
  private applicationService = inject(ThemeApplicationService);
  private snackBar = inject(MatSnackBar);

  // Filter state
  searchQuery = '';
  filterType: 'all' | 'monthly' | 'holiday' | 'custom' = 'all';

  // Expose service signals
  themes = this.themeService.themes;
  isLoading = this.themeService.isLoading;
  isApplying = this.applicationService.isApplying;
  activeThemeInfo = this.themeService.activeThemeInfo;

  // Filter type
  private filterSignal = signal<{ search: string; type: 'all' | 'monthly' | 'holiday' | 'custom' }>({
    search: '',
    type: 'all'
  });

  filteredThemes = computed(() => {
    const filter = this.filterSignal();
    let themes = this.themes();

    // Filter by type
    if (filter.type === 'monthly') {
      themes = themes.filter(t => t.month !== undefined && !t.isHoliday);
    } else if (filter.type === 'holiday') {
      themes = themes.filter(t => t.isHoliday === true);
    } else if (filter.type === 'custom') {
      themes = themes.filter(t => t.month === undefined && !t.isHoliday);
    }

    // Filter by search
    if (filter.search) {
      const search = filter.search.toLowerCase();
      themes = themes.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return themes;
  });

  async ngOnInit() {
    await Promise.all([
      this.themeService.loadThemes(),
      this.themeService.loadActiveTheme(),
    ]);
  }

  onSearchChange(): void {
    this.filterSignal.update(f => ({ ...f, search: this.searchQuery }));
  }

  onFilterChange(): void {
    this.filterSignal.update(f => ({
      ...f,
      type: this.filterType as 'all' | 'monthly' | 'holiday' | 'custom'
    }));
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterType = 'all';
    this.filterSignal.set({ search: '', type: 'all' });
  }

  isActiveTheme(themeId: string): boolean {
    return this.activeThemeInfo()?.themeId === themeId;
  }

  async applyTheme(themeId: string, variant: 'day' | 'night'): Promise<void> {
    const result = await this.applicationService.applyTheme(themeId, variant);

    if (result.success) {
      this.snackBar.open('Theme applied successfully', 'Dismiss', {
        duration: 3000,
      });
      await this.themeService.loadActiveTheme();
    } else {
      const errorMsg = result.errors?.map(e => e.error).join(', ') || 'Unknown error';
      this.snackBar.open(`Failed to apply theme: ${errorMsg}`, 'Dismiss', {
        duration: 5000,
      });
    }
  }

  async duplicateTheme(theme: ThemeMetadata): Promise<void> {
    const newId = `${theme.id}-copy-${Date.now()}`;
    const newName = `${theme.name} (Copy)`;

    const duplicate = await this.themeService.duplicateTheme(
      theme.id,
      newId,
      newName
    );

    if (duplicate) {
      this.snackBar.open('Theme duplicated', 'Dismiss', { duration: 3000 });
    } else {
      this.snackBar.open('Failed to duplicate theme', 'Dismiss', {
        duration: 5000,
      });
    }
  }

  async deleteTheme(theme: ThemeMetadata): Promise<void> {
    if (this.isActiveTheme(theme.id)) {
      this.snackBar.open('Cannot delete the active theme', 'Dismiss', {
        duration: 3000,
      });
      return;
    }

    // In a real app, show a confirmation dialog
    const confirmed = confirm(`Delete theme "${theme.name}"? This cannot be undone.`);
    if (!confirmed) return;

    const success = await this.themeService.deleteTheme(theme.id);

    if (success) {
      this.snackBar.open('Theme deleted', 'Dismiss', { duration: 3000 });
    } else {
      this.snackBar.open('Failed to delete theme', 'Dismiss', {
        duration: 5000,
      });
    }
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1] || '';
  }
}
