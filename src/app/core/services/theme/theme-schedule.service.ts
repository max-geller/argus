import { Injectable, signal, computed } from '@angular/core';
import { TauriService } from '../tauri.service';
import {
  ThemeSchedule,
  ThemeLocation,
  ThemeHoliday,
  MonthlyThemes,
  SolarTimes,
  ScheduleEvaluation,
  DEFAULT_SCHEDULE,
  validateSchedule,
  getMonthName,
} from '../../models/theme';

/**
 * ThemeScheduleService handles automatic theme switching based on
 * time of day, month, and holiday schedules.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeScheduleService {
  // State signals
  readonly schedule = signal<ThemeSchedule>(DEFAULT_SCHEDULE);
  readonly solarTimes = signal<SolarTimes | null>(null);
  readonly scheduleEvaluation = signal<ScheduleEvaluation | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed properties
  readonly isDayTime = computed(() => this.solarTimes()?.isDay ?? true);
  readonly currentVariant = computed(() =>
    this.scheduleEvaluation()?.variant ?? 'day'
  );
  readonly currentThemeId = computed(() =>
    this.scheduleEvaluation()?.themeId ?? ''
  );
  readonly nextChangeTime = computed(() =>
    this.scheduleEvaluation()?.nextChange ?? null
  );
  readonly isDayNightEnabled = computed(() =>
    this.schedule().dayNightEnabled
  );
  readonly scheduleMode = computed(() => this.schedule().defaultMode);

  constructor(private tauri: TauriService) {}

  /**
   * Load the schedule configuration from the backend.
   */
  async loadSchedule(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const schedule = await this.tauri.invoke<ThemeSchedule>('theme_get_schedule');
      this.schedule.set(schedule);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load schedule';
      this.error.set(errorMessage);
      console.error('Failed to load schedule:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Save the schedule configuration.
   */
  async saveSchedule(schedule: ThemeSchedule): Promise<boolean> {
    // Validate schedule
    const validation = validateSchedule(schedule);
    if (!validation.valid) {
      this.error.set(validation.errors.join(', '));
      return false;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.tauri.invoke('theme_save_schedule', { schedule });
      this.schedule.set(schedule);
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save schedule';
      this.error.set(errorMessage);
      console.error('Failed to save schedule:', e);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update schedule with partial changes.
   */
  async updateSchedule(
    updates: Partial<ThemeSchedule>
  ): Promise<boolean> {
    const current = this.schedule();
    const updated: ThemeSchedule = {
      ...current,
      ...updates,
    };
    return await this.saveSchedule(updated);
  }

  /**
   * Get which theme should be active for the current date/time.
   */
  async evaluateSchedule(): Promise<ScheduleEvaluation | null> {
    try {
      const evaluation = await this.tauri.invoke<ScheduleEvaluation>(
        'theme_get_active_for_date'
      );
      this.scheduleEvaluation.set(evaluation);
      return evaluation;
    } catch (e) {
      console.error('Failed to evaluate schedule:', e);
      return null;
    }
  }

  /**
   * Get solar times for the configured location.
   */
  async loadSolarTimes(): Promise<void> {
    const location = this.schedule().location;

    try {
      const times = await this.tauri.invoke<SolarTimes>('solar_get_times', {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      });
      this.solarTimes.set(times);
    } catch (e) {
      console.error('Failed to load solar times:', e);
    }
  }

  /**
   * Check if it's currently daytime.
   */
  async checkIsDay(): Promise<boolean> {
    const schedule = this.schedule();

    try {
      return await this.tauri.invoke<boolean>('solar_is_day', {
        latitude: schedule.location.latitude,
        longitude: schedule.location.longitude,
        sunriseOffset: schedule.sunriseOffset,
        sunsetOffset: schedule.sunsetOffset,
      });
    } catch (e) {
      console.error('Failed to check day/night status:', e);
      return true; // Default to day
    }
  }

  /**
   * Get the next day/night transition time.
   */
  async getNextTransition(): Promise<{ time: string; toDay: boolean } | null> {
    const schedule = this.schedule();

    try {
      const [time, toDay] = await this.tauri.invoke<[string, boolean]>(
        'solar_get_next_transition',
        {
          latitude: schedule.location.latitude,
          longitude: schedule.location.longitude,
          sunriseOffset: schedule.sunriseOffset,
          sunsetOffset: schedule.sunsetOffset,
        }
      );
      return { time, toDay };
    } catch (e) {
      console.error('Failed to get next transition:', e);
      return null;
    }
  }

  /**
   * Set up systemd timer for automatic theme switching.
   */
  async setupSystemdTimer(): Promise<boolean> {
    try {
      await this.tauri.invoke<string>('theme_setup_systemd_timer');
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to set up timer';
      this.error.set(errorMessage);
      console.error('Failed to set up systemd timer:', e);
      return false;
    }
  }

  /**
   * Update location settings.
   */
  async setLocation(location: ThemeLocation): Promise<boolean> {
    return await this.updateSchedule({ location });
  }

  /**
   * Update sunrise/sunset offsets.
   */
  async setOffsets(
    sunriseOffset: number,
    sunsetOffset: number
  ): Promise<boolean> {
    return await this.updateSchedule({ sunriseOffset, sunsetOffset });
  }

  /**
   * Toggle day/night automatic switching.
   */
  async toggleDayNight(enabled: boolean): Promise<boolean> {
    return await this.updateSchedule({ dayNightEnabled: enabled });
  }

  /**
   * Set the schedule mode.
   */
  async setScheduleMode(
    mode: 'monthly' | 'manual' | 'fixed'
  ): Promise<boolean> {
    return await this.updateSchedule({ defaultMode: mode });
  }

  /**
   * Set the theme for a specific month.
   */
  async setMonthlyTheme(month: number, themeId: string): Promise<boolean> {
    const current = this.schedule();

    const monthly: MonthlyThemes = {
      ...current.monthly,
    };

    // Set the theme for the specified month
    (monthly as Record<number, string | undefined>)[month] = themeId;

    return await this.updateSchedule({ monthly });
  }

  /**
   * Add or update a holiday.
   */
  async setHoliday(holiday: ThemeHoliday): Promise<boolean> {
    const current = this.schedule();
    const holidays = [...current.holidays];

    // Find existing holiday by name
    const existingIndex = holidays.findIndex((h) => h.name === holiday.name);
    if (existingIndex >= 0) {
      holidays[existingIndex] = holiday;
    } else {
      holidays.push(holiday);
    }

    return await this.updateSchedule({ holidays });
  }

  /**
   * Remove a holiday.
   */
  async removeHoliday(holidayName: string): Promise<boolean> {
    const current = this.schedule();
    const holidays = current.holidays.filter((h) => h.name !== holidayName);
    return await this.updateSchedule({ holidays });
  }

  /**
   * Toggle a holiday's enabled state.
   */
  async toggleHoliday(holidayName: string, enabled: boolean): Promise<boolean> {
    const current = this.schedule();
    const holidays = current.holidays.map((h) =>
      h.name === holidayName ? { ...h, enabled } : h
    );
    return await this.updateSchedule({ holidays });
  }

  /**
   * Get theme ID for a specific month.
   */
  getThemeForMonth(month: number): string | undefined {
    const monthly = this.schedule().monthly as Record<number, string | undefined>;
    return monthly[month];
  }

  /**
   * Get display name for a month.
   */
  getMonthDisplayName(month: number): string {
    return getMonthName(month);
  }

  /**
   * Clear error state.
   */
  clearError(): void {
    this.error.set(null);
  }
}
