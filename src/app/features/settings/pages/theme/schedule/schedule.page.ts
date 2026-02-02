import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { ThemeService } from '@core/services/theme/theme.service';
import { ThemeScheduleService } from '@core/services/theme/theme-schedule.service';
import { ThemeHoliday, MONTH_NAMES } from '@core/models/theme';

@Component({
  selector: 'app-theme-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="schedule-page">
      <header class="page-header">
        <div class="header-content">
          <button mat-icon-button routerLink="../hyprpaper">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Theme Schedule</h1>
            <p class="subtitle">Configure automatic theme switching</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            color="primary"
            [disabled]="!hasChanges() || isSaving()"
            (click)="saveSchedule()"
          >
            @if (isSaving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Save Changes
          </button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading schedule...</p>
        </div>
      }

      @if (!isLoading()) {
        <div class="schedule-content">
          <!-- Schedule Mode Card -->
          <mat-card class="mode-card">
            <mat-card-header>
              <mat-card-title>Schedule Mode</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mode</mat-label>
                <mat-select
                  [(ngModel)]="scheduleMode"
                  (selectionChange)="onModeChange()"
                >
                  <mat-option value="monthly">
                    Monthly - Auto-switch based on calendar month
                  </mat-option>
                  <mat-option value="fixed">
                    Fixed - Use a single theme always
                  </mat-option>
                  <mat-option value="manual">
                    Manual - Only change via UI/shortcuts
                  </mat-option>
                </mat-select>
              </mat-form-field>

              @if (scheduleMode === 'fixed') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Fixed Theme</mat-label>
                  <mat-select [(ngModel)]="fixedTheme" (selectionChange)="markDirty()">
                    @for (theme of themes(); track theme.id) {
                      <mat-option [value]="theme.id">{{ theme.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }
            </mat-card-content>
          </mat-card>

          <!-- Day/Night Settings Card -->
          <mat-card class="daynight-card">
            <mat-card-header>
              <mat-card-title>Day/Night Switching</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-slide-toggle
                [(ngModel)]="dayNightEnabled"
                (change)="markDirty()"
              >
                Enable automatic day/night variant switching
              </mat-slide-toggle>

              @if (dayNightEnabled) {
                <div class="solar-info">
                  @if (solarTimes(); as solar) {
                    <div class="solar-times-display">
                      <div class="time-item">
                        <mat-icon>wb_sunny</mat-icon>
                        <span>Sunrise: {{ formatTime(solar.sunrise) }}</span>
                      </div>
                      <div class="time-item">
                        <mat-icon>nights_stay</mat-icon>
                        <span>Sunset: {{ formatTime(solar.sunset) }}</span>
                      </div>
                    </div>
                  }
                </div>

                <div class="offset-fields">
                  <mat-form-field appearance="outline">
                    <mat-label>Sunrise Offset (minutes)</mat-label>
                    <input
                      matInput
                      type="number"
                      [(ngModel)]="sunriseOffset"
                      (ngModelChange)="markDirty()"
                    >
                    <mat-hint>Positive = later, Negative = earlier</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Sunset Offset (minutes)</mat-label>
                    <input
                      matInput
                      type="number"
                      [(ngModel)]="sunsetOffset"
                      (ngModelChange)="markDirty()"
                    >
                  </mat-form-field>
                </div>
              } @else {
                <mat-form-field appearance="outline">
                  <mat-label>Fixed Variant</mat-label>
                  <mat-select [(ngModel)]="fixedVariant" (selectionChange)="markDirty()">
                    <mat-option value="day">Day</mat-option>
                    <mat-option value="night">Night</mat-option>
                  </mat-select>
                </mat-form-field>
              }
            </mat-card-content>
          </mat-card>

          <!-- Location Settings Card -->
          <mat-card class="location-card">
            <mat-card-header>
              <mat-card-title>Location</mat-card-title>
              <mat-card-subtitle>Used for sunrise/sunset calculations</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="location-fields">
                <mat-form-field appearance="outline">
                  <mat-label>Latitude</mat-label>
                  <input
                    matInput
                    type="number"
                    step="0.0001"
                    [(ngModel)]="latitude"
                    (ngModelChange)="markDirty()"
                  >
                  <mat-hint>-90 to 90</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Longitude</mat-label>
                  <input
                    matInput
                    type="number"
                    step="0.0001"
                    [(ngModel)]="longitude"
                    (ngModelChange)="markDirty()"
                  >
                  <mat-hint>-180 to 180</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Timezone</mat-label>
                  <input
                    matInput
                    [(ngModel)]="timezone"
                    (ngModelChange)="markDirty()"
                  >
                  <mat-hint>e.g., America/New_York</mat-hint>
                </mat-form-field>
              </div>

              <button mat-button (click)="detectLocation()">
                <mat-icon>my_location</mat-icon>
                Detect Location
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Monthly Themes Card -->
          @if (scheduleMode === 'monthly') {
            <mat-card class="monthly-card">
              <mat-card-header>
                <mat-card-title>Monthly Themes</mat-card-title>
                <mat-card-subtitle>Assign a theme to each month</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="monthly-grid">
                  @for (month of months; track month.value) {
                    <div class="month-item" [class.current]="isCurrentMonth(month.value)">
                      <span class="month-name">
                        {{ month.name }}
                        @if (isCurrentMonth(month.value)) {
                          <mat-chip class="current-chip">Current</mat-chip>
                        }
                      </span>
                      <mat-form-field appearance="outline">
                        <mat-select
                          [ngModel]="getMonthlyTheme(month.value)"
                          (selectionChange)="setMonthlyTheme(month.value, $event.value)"
                        >
                          <mat-option [value]="''">No theme</mat-option>
                          @for (theme of themes(); track theme.id) {
                            <mat-option [value]="theme.id">{{ theme.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Holidays Card -->
          <mat-card class="holidays-card">
            <mat-card-header>
              <mat-card-title>Holiday Overrides</mat-card-title>
              <mat-card-subtitle>Themes for special occasions (override monthly)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (holidays.length === 0) {
                <div class="no-holidays">
                  <p>No holidays configured</p>
                </div>
              } @else {
                <table mat-table [dataSource]="holidays" class="holidays-table">
                  <ng-container matColumnDef="enabled">
                    <th mat-header-cell *matHeaderCellDef>Enabled</th>
                    <td mat-cell *matCellDef="let holiday">
                      <mat-slide-toggle
                        [checked]="holiday.enabled !== false"
                        (change)="toggleHoliday(holiday, $event.checked)"
                      ></mat-slide-toggle>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Holiday</th>
                    <td mat-cell *matCellDef="let holiday">{{ holiday.name }}</td>
                  </ng-container>

                  <ng-container matColumnDef="dates">
                    <th mat-header-cell *matHeaderCellDef>Dates</th>
                    <td mat-cell *matCellDef="let holiday">
                      {{ holiday.startDate }} to {{ holiday.endDate }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="theme">
                    <th mat-header-cell *matHeaderCellDef>Theme</th>
                    <td mat-cell *matCellDef="let holiday">
                      {{ getThemeName(holiday.theme) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let holiday">
                      <button mat-icon-button (click)="editHoliday(holiday)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="removeHoliday(holiday)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="holidayColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: holidayColumns;"></tr>
                </table>
              }

              <button mat-button (click)="addHoliday()">
                <mat-icon>add</mat-icon>
                Add Holiday
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Systemd Timer Card -->
          <mat-card class="timer-card">
            <mat-card-header>
              <mat-card-title>System Integration</mat-card-title>
              <mat-card-subtitle>Enable background theme switching</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>
                Set up a systemd timer to automatically switch themes even when Argus is not running.
              </p>
              <button mat-raised-button (click)="setupSystemdTimer()">
                <mat-icon>schedule</mat-icon>
                Set Up Systemd Timer
              </button>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .schedule-page {
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
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px;
      gap: 16px;
    }

    .schedule-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .full-width {
      width: 100%;
    }

    .solar-info {
      margin: 16px 0;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }

    .solar-times-display {
      display: flex;
      gap: 24px;

      .time-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .offset-fields {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .location-fields {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .monthly-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .month-item {
      padding: 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.03);

      &.current {
        border: 1px solid var(--mdc-theme-primary);
      }

      .month-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .current-chip {
        font-size: 0.7rem;
      }

      mat-form-field {
        width: 100%;
      }
    }

    .holidays-table {
      width: 100%;
      margin-bottom: 16px;
    }

    .no-holidays {
      padding: 24px;
      text-align: center;
      color: var(--mdc-theme-text-secondary-on-background);
    }

    .timer-card p {
      margin-bottom: 16px;
    }
  `],
})
export class SchedulePageComponent implements OnInit {
  private themeService = inject(ThemeService);
  private scheduleService = inject(ThemeScheduleService);
  private snackBar = inject(MatSnackBar);

  // Local state for editing
  scheduleMode: 'monthly' | 'manual' | 'fixed' = 'monthly';
  dayNightEnabled = true;
  sunriseOffset = 0;
  sunsetOffset = 0;
  latitude = 40.7128;
  longitude = -74.0060;
  timezone = 'America/New_York';
  fixedTheme = '';
  fixedVariant: 'day' | 'night' = 'day';
  holidays: ThemeHoliday[] = [];
  monthlyThemes: Record<number, string> = {};

  holidayColumns = ['enabled', 'name', 'dates', 'theme', 'actions'];

  isDirty = signal(false);
  isSaving = signal(false);

  // Service signals
  themes = this.themeService.themes;
  isLoading = this.scheduleService.isLoading;
  solarTimes = this.scheduleService.solarTimes;

  hasChanges = computed(() => this.isDirty());

  months = MONTH_NAMES.map((name, i) => ({ value: i + 1, name }));

  async ngOnInit() {
    await Promise.all([
      this.themeService.loadThemes(),
      this.scheduleService.loadSchedule(),
      this.scheduleService.loadSolarTimes(),
    ]);

    // Load schedule into local state
    const schedule = this.scheduleService.schedule();
    this.scheduleMode = schedule.defaultMode as 'monthly' | 'manual' | 'fixed';
    this.dayNightEnabled = schedule.dayNightEnabled;
    this.sunriseOffset = schedule.sunriseOffset;
    this.sunsetOffset = schedule.sunsetOffset;
    this.latitude = schedule.location.latitude;
    this.longitude = schedule.location.longitude;
    this.timezone = schedule.location.timezone;
    this.fixedTheme = schedule.fixedTheme || '';
    this.fixedVariant = (schedule.fixedVariant as 'day' | 'night') || 'day';
    this.holidays = [...schedule.holidays];

    // Convert monthly themes to local state
    const monthly = schedule.monthly as Record<string, string | undefined>;
    for (let i = 1; i <= 12; i++) {
      this.monthlyThemes[i] = monthly[i.toString()] || '';
    }
  }

  markDirty(): void {
    this.isDirty.set(true);
  }

  onModeChange(): void {
    this.markDirty();
  }

  getMonthlyTheme(month: number): string {
    return this.monthlyThemes[month] || '';
  }

  setMonthlyTheme(month: number, themeId: string): void {
    this.monthlyThemes[month] = themeId;
    this.markDirty();
  }

  isCurrentMonth(month: number): boolean {
    return new Date().getMonth() + 1 === month;
  }

  async saveSchedule(): Promise<void> {
    this.isSaving.set(true);

    const schedule = {
      defaultMode: this.scheduleMode,
      dayNightEnabled: this.dayNightEnabled,
      sunriseOffset: this.sunriseOffset,
      sunsetOffset: this.sunsetOffset,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        timezone: this.timezone,
      },
      fixedTheme: this.fixedTheme || undefined,
      fixedVariant: this.fixedVariant,
      holidays: this.holidays,
      monthly: {
        1: this.monthlyThemes[1] || undefined,
        2: this.monthlyThemes[2] || undefined,
        3: this.monthlyThemes[3] || undefined,
        4: this.monthlyThemes[4] || undefined,
        5: this.monthlyThemes[5] || undefined,
        6: this.monthlyThemes[6] || undefined,
        7: this.monthlyThemes[7] || undefined,
        8: this.monthlyThemes[8] || undefined,
        9: this.monthlyThemes[9] || undefined,
        10: this.monthlyThemes[10] || undefined,
        11: this.monthlyThemes[11] || undefined,
        12: this.monthlyThemes[12] || undefined,
      },
    };

    const success = await this.scheduleService.saveSchedule(schedule as any);

    if (success) {
      this.isDirty.set(false);
      this.snackBar.open('Schedule saved', 'Dismiss', { duration: 3000 });
    } else {
      this.snackBar.open('Failed to save schedule', 'Dismiss', {
        duration: 5000,
      });
    }

    this.isSaving.set(false);
  }

  async detectLocation(): Promise<void> {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          this.markDirty();
          this.snackBar.open('Location detected', 'Dismiss', { duration: 3000 });
        },
        (error) => {
          this.snackBar.open('Failed to detect location', 'Dismiss', {
            duration: 3000,
          });
        }
      );
    } else {
      this.snackBar.open('Geolocation not supported', 'Dismiss', {
        duration: 3000,
      });
    }
  }

  toggleHoliday(holiday: ThemeHoliday, enabled: boolean): void {
    const index = this.holidays.findIndex(h => h.name === holiday.name);
    if (index >= 0) {
      this.holidays[index] = { ...this.holidays[index], enabled };
      this.markDirty();
    }
  }

  addHoliday(): void {
    const name = prompt('Holiday name:');
    if (!name) return;

    const theme = prompt('Theme ID:');
    if (!theme) return;

    const startDate = prompt('Start date (MM-DD):');
    if (!startDate) return;

    const endDate = prompt('End date (MM-DD):');
    if (!endDate) return;

    this.holidays.push({
      name,
      theme,
      startDate,
      endDate,
      enabled: true,
    });

    this.markDirty();
  }

  editHoliday(holiday: ThemeHoliday): void {
    // In a real app, show a dialog
    const theme = prompt('Theme ID:', holiday.theme);
    if (!theme) return;

    const index = this.holidays.findIndex(h => h.name === holiday.name);
    if (index >= 0) {
      this.holidays[index] = { ...this.holidays[index], theme };
      this.markDirty();
    }
  }

  removeHoliday(holiday: ThemeHoliday): void {
    if (!confirm(`Remove holiday "${holiday.name}"?`)) return;

    this.holidays = this.holidays.filter(h => h.name !== holiday.name);
    this.markDirty();
  }

  getThemeName(themeId: string): string {
    const theme = this.themes().find(t => t.id === themeId);
    return theme?.name || themeId;
  }

  async setupSystemdTimer(): Promise<void> {
    const success = await this.scheduleService.setupSystemdTimer();

    if (success) {
      this.snackBar.open('Systemd timer set up successfully', 'Dismiss', {
        duration: 3000,
      });
    } else {
      this.snackBar.open('Failed to set up timer', 'Dismiss', {
        duration: 5000,
      });
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
}
