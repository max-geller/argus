import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { ThemeService } from '@core/services/theme/theme.service';
import { ThemeApplicationService } from '@core/services/theme/theme-application.service';
import { ThemeScheduleService } from '@core/services/theme/theme-schedule.service';

@Component({
  selector: 'app-hyprpaper',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="hyprpaper-page">
      <header class="page-header">
        <h1>HyprPaper Theme Manager</h1>
        <p class="subtitle">Control your desktop appearance across all MaxOS components</p>
      </header>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading theme data...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon>error</mat-icon>
            <span>{{ error() }}</span>
            <button mat-button (click)="clearError()">Dismiss</button>
          </mat-card-content>
        </mat-card>
      }

      @if (!isLoading()) {
        <div class="content-grid">
          <!-- Current Theme Card -->
          <mat-card class="current-theme-card">
            <mat-card-header>
              <mat-card-title>Current Theme</mat-card-title>
              <mat-card-subtitle>
                @if (activeInfo()) {
                  Applied {{ formatDate(activeInfo()!.appliedAt) }}
                } @else {
                  No theme applied
                }
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              @if (activeInfo(); as info) {
                <div class="theme-preview">
                  <div
                    class="wallpaper-preview"
                    [style.backgroundImage]="'url(' + info.wallpaper + ')'"
                  >
                    <div class="overlay">
                      <span class="theme-name">{{ info.themeName }}</span>
                      <mat-chip-set>
                        <mat-chip [highlighted]="info.variant === 'day'">
                          <mat-icon>{{ info.variant === 'day' ? 'light_mode' : 'dark_mode' }}</mat-icon>
                          {{ info.variant === 'day' ? 'Day' : 'Night' }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                  </div>

                  <div class="accent-color">
                    <div
                      class="color-swatch"
                      [style.backgroundColor]="info.accentColor"
                    ></div>
                    <span>Accent: {{ info.accentColor }}</span>
                  </div>
                </div>
              } @else {
                <div class="no-theme">
                  <mat-icon>palette</mat-icon>
                  <p>No theme is currently applied</p>
                  <button mat-raised-button color="primary" routerLink="../gallery">
                    Browse Themes
                  </button>
                </div>
              }
            </mat-card-content>

            @if (activeInfo()) {
              <mat-card-actions>
                <button mat-button (click)="toggleVariant()">
                  <mat-icon>{{ scheduleService.currentVariant() === 'day' ? 'dark_mode' : 'light_mode' }}</mat-icon>
                  Switch to {{ scheduleService.currentVariant() === 'day' ? 'Night' : 'Day' }}
                </button>
                <button mat-button routerLink="../editor" [queryParams]="{id: activeInfo()!.themeId}">
                  <mat-icon>edit</mat-icon>
                  Edit Theme
                </button>
              </mat-card-actions>
            }
          </mat-card>

          <!-- Quick Switch Card -->
          <mat-card class="quick-switch-card">
            <mat-card-header>
              <mat-card-title>Quick Switch</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <mat-select
                [(value)]="selectedThemeId"
                placeholder="Select a theme"
                (selectionChange)="onThemeSelected()"
              >
                @for (theme of themes(); track theme.id) {
                  <mat-option [value]="theme.id">
                    {{ theme.name }}
                    @if (theme.month) {
                      <span class="month-badge">{{ getMonthName(theme.month) }}</span>
                    }
                  </mat-option>
                }
              </mat-select>

              <div class="variant-toggle">
                <span>Variant:</span>
                <mat-slide-toggle
                  [(ngModel)]="useNightVariant"
                  [disabled]="!selectedThemeId"
                >
                  {{ useNightVariant ? 'Night' : 'Day' }}
                </mat-slide-toggle>
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button
                mat-raised-button
                color="primary"
                [disabled]="!selectedThemeId || isApplying()"
                (click)="applySelectedTheme()"
              >
                @if (isApplying()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>check</mat-icon>
                }
                Apply Theme
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Schedule Status Card -->
          <mat-card class="schedule-card">
            <mat-card-header>
              <mat-card-title>Schedule Status</mat-card-title>
              <mat-card-subtitle>
                Mode: {{ scheduleService.scheduleMode() | titlecase }}
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              @if (solarTimes(); as solar) {
                <div class="solar-times">
                  <div class="time-item">
                    <mat-icon>wb_sunny</mat-icon>
                    <span>Sunrise: {{ formatTime(solar.sunrise) }}</span>
                  </div>
                  <div class="time-item">
                    <mat-icon>nights_stay</mat-icon>
                    <span>Sunset: {{ formatTime(solar.sunset) }}</span>
                  </div>
                  <div class="time-item">
                    <mat-icon>schedule</mat-icon>
                    <span>Day length: {{ formatDayLength(solar.dayLength) }}</span>
                  </div>
                </div>
              }

              @if (scheduleEvaluation(); as eval) {
                <div class="next-change">
                  <mat-icon>update</mat-icon>
                  <span>
                    @if (eval.nextChange) {
                      Next change: {{ formatDate(eval.nextChange) }}
                      ({{ eval.nextChangeType }})
                    } @else {
                      No scheduled changes
                    }
                  </span>
                </div>

                @if (eval.holiday) {
                  <mat-chip-set>
                    <mat-chip color="accent" highlighted>
                      <mat-icon>celebration</mat-icon>
                      {{ eval.holiday }}
                    </mat-chip>
                  </mat-chip-set>
                }
              }

              <mat-slide-toggle
                [checked]="scheduleService.isDayNightEnabled()"
                (change)="toggleDayNight($event.checked)"
              >
                Auto day/night switching
              </mat-slide-toggle>
            </mat-card-content>

            <mat-card-actions>
              <button mat-button routerLink="../schedule">
                <mat-icon>settings</mat-icon>
                Configure Schedule
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Application Status Card -->
          @if (lastResult()) {
            <mat-card class="status-card" [class.has-errors]="hasErrors()">
              <mat-card-header>
                <mat-card-title>Last Application</mat-card-title>
              </mat-card-header>

              <mat-card-content>
                <div class="app-status-list">
                  @for (app of lastResult()!.appliedTo; track app) {
                    <div class="app-status success">
                      <mat-icon>check_circle</mat-icon>
                      <span>{{ app | titlecase }}</span>
                    </div>
                  }

                  @for (err of lastResult()!.errors; track err.app) {
                    <div class="app-status error">
                      <mat-icon>error</mat-icon>
                      <span>{{ err.app }}: {{ err.error }}</span>
                    </div>
                  }
                </div>

                @if (lastResult()!.requiresRestart && lastResult()!.requiresRestart!.length > 0) {
                  <div class="restart-notice">
                    <mat-icon>info</mat-icon>
                    <span>
                      Restart required for: {{ lastResult()!.requiresRestart!.join(', ') }}
                    </span>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button mat-fab extended routerLink="../gallery">
            <mat-icon>collections</mat-icon>
            Browse Gallery
          </button>
          <button mat-fab extended routerLink="../editor">
            <mat-icon>add</mat-icon>
            Create Theme
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .hyprpaper-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;

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

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      gap: 16px;
    }

    .error-card {
      margin-bottom: 24px;
      background-color: #f44336;

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .current-theme-card {
      .theme-preview {
        margin-top: 16px;
      }

      .wallpaper-preview {
        height: 200px;
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        position: relative;
        overflow: hidden;

        .overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .theme-name {
          font-size: 1.25rem;
          font-weight: 500;
        }
      }

      .accent-color {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;

        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: 2px solid rgba(255,255,255,0.2);
        }
      }
    }

    .no-theme {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      gap: 16px;
      color: var(--mdc-theme-text-secondary-on-background);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    .quick-switch-card {
      mat-select {
        width: 100%;
        margin-bottom: 16px;
      }

      .month-badge {
        margin-left: 8px;
        font-size: 0.75rem;
        opacity: 0.7;
      }

      .variant-toggle {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .schedule-card {
      .solar-times {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;

        .time-item {
          display: flex;
          align-items: center;
          gap: 8px;

          mat-icon {
            color: var(--mdc-theme-primary);
          }
        }
      }

      .next-change {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
      }

      mat-chip-set {
        margin-bottom: 16px;
      }
    }

    .status-card {
      &.has-errors {
        border-left: 4px solid #f44336;
      }

      .app-status-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .app-status {
        display: flex;
        align-items: center;
        gap: 8px;

        &.success mat-icon {
          color: #4caf50;
        }

        &.error mat-icon {
          color: #f44336;
        }
      }

      .restart-notice {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding: 12px;
        background: rgba(255,193,7,0.1);
        border-radius: 8px;

        mat-icon {
          color: #ffc107;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    mat-card-actions {
      padding: 8px 16px 16px;
    }
  `],
})
export class HyprpaperPageComponent implements OnInit {
  private themeService = inject(ThemeService);
  private applicationService = inject(ThemeApplicationService);
  protected scheduleService = inject(ThemeScheduleService);
  private snackBar = inject(MatSnackBar);

  // State
  selectedThemeId: string | null = null;
  useNightVariant = false;

  // Expose service signals
  themes = this.themeService.themes;
  activeInfo = this.themeService.activeThemeInfo;
  isLoading = computed(() =>
    this.themeService.isLoading() || this.scheduleService.isLoading()
  );
  isApplying = this.applicationService.isApplying;
  error = computed(() =>
    this.themeService.error() || this.scheduleService.error()
  );
  lastResult = this.applicationService.lastApplicationResult;
  hasErrors = this.applicationService.hasErrors;
  solarTimes = this.scheduleService.solarTimes;
  scheduleEvaluation = this.scheduleService.scheduleEvaluation;

  private monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  async ngOnInit() {
    await Promise.all([
      this.themeService.loadThemes(),
      this.themeService.loadActiveTheme(),
      this.scheduleService.loadSchedule(),
      this.scheduleService.loadSolarTimes(),
      this.scheduleService.evaluateSchedule(),
    ]);

    // Set initial selection to current theme
    if (this.activeInfo()) {
      this.selectedThemeId = this.activeInfo()!.themeId;
      this.useNightVariant = this.activeInfo()!.variant === 'night';
    }
  }

  onThemeSelected(): void {
    // Reset variant when theme changes
    this.useNightVariant = false;
  }

  async applySelectedTheme(): Promise<void> {
    if (!this.selectedThemeId) return;

    const variant = this.useNightVariant ? 'night' : 'day';
    const result = await this.applicationService.applyTheme(
      this.selectedThemeId,
      variant
    );

    if (result.success) {
      this.snackBar.open('Theme applied successfully', 'Dismiss', {
        duration: 3000,
      });
      await this.themeService.loadActiveTheme();
    } else {
      this.snackBar.open('Failed to apply theme', 'Dismiss', {
        duration: 5000,
      });
    }
  }

  async toggleVariant(): Promise<void> {
    if (!this.activeInfo()) return;

    const newVariant = this.scheduleService.currentVariant() === 'day' ? 'night' : 'day';
    const result = await this.applicationService.applyTheme(
      this.activeInfo()!.themeId,
      newVariant
    );

    if (result.success) {
      await this.themeService.loadActiveTheme();
    }
  }

  async toggleDayNight(enabled: boolean): Promise<void> {
    await this.scheduleService.toggleDayNight(enabled);
  }

  clearError(): void {
    this.themeService.clearError();
    this.scheduleService.clearError();
  }

  getMonthName(month: number): string {
    return this.monthNames[month] || '';
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  formatTime(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  formatDayLength(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
