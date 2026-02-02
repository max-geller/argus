/**
 * Schedule Model
 *
 * Defines scheduling configuration for automatic theme switching
 * based on time, date, location (for solar calculations), and holidays.
 */

/**
 * Geographic location for solar calculations.
 */
export interface ThemeLocation {
  /** Latitude in decimal degrees */
  latitude: number;

  /** Longitude in decimal degrees */
  longitude: number;

  /** IANA timezone string (e.g., "America/New_York") */
  timezone: string;
}

/**
 * Holiday override configuration.
 */
export interface ThemeHoliday {
  /** Holiday name for display */
  name: string;

  /** Theme ID to apply during this holiday */
  theme: string;

  /** Start date in MM-DD format (e.g., "12-25" for Christmas) */
  startDate: string;

  /** End date in MM-DD format */
  endDate: string;

  /** Optional: specific year if not recurring */
  year?: number;

  /** Whether this holiday is enabled */
  enabled?: boolean;
}

/**
 * Monthly theme assignments (1-12 mapped to theme IDs).
 */
export interface MonthlyThemes {
  1?: string; // January
  2?: string; // February
  3?: string; // March
  4?: string; // April
  5?: string; // May
  6?: string; // June
  7?: string; // July
  8?: string; // August
  9?: string; // September
  10?: string; // October
  11?: string; // November
  12?: string; // December
}

/**
 * Theme scheduling mode.
 */
export type ScheduleMode = 'monthly' | 'manual' | 'fixed';

/**
 * Complete schedule configuration.
 */
export interface ThemeSchedule {
  /** Current scheduling mode */
  defaultMode: ScheduleMode;

  /** Geographic location for solar calculations */
  location: ThemeLocation;

  /** Whether to auto-switch between day/night variants */
  dayNightEnabled: boolean;

  /** Minutes to add/subtract from sunrise time */
  sunriseOffset: number;

  /** Minutes to add/subtract from sunset time */
  sunsetOffset: number;

  /** Monthly theme assignments */
  monthly: MonthlyThemes;

  /** Holiday overrides (take precedence over monthly) */
  holidays: ThemeHoliday[];

  /** Theme to use when mode is 'fixed' */
  fixedTheme?: string;

  /** Fixed variant when dayNightEnabled is false */
  fixedVariant?: 'day' | 'night';

  /** Last time the schedule was evaluated */
  lastEvaluated?: string;
}

/**
 * Solar times for a given date and location.
 */
export interface SolarTimes {
  /** Sunrise time in ISO format */
  sunrise: string;

  /** Sunset time in ISO format */
  sunset: string;

  /** Solar noon in ISO format */
  solarNoon: string;

  /** Day length in minutes */
  dayLength: number;

  /** Whether it's currently daytime */
  isDay: boolean;

  /** Civil twilight begin (before sunrise) */
  civilTwilightBegin?: string;

  /** Civil twilight end (after sunset) */
  civilTwilightEnd?: string;
}

/**
 * Result of schedule evaluation.
 */
export interface ScheduleEvaluation {
  /** Theme ID that should be active */
  themeId: string;

  /** Which variant (day/night) should be active */
  variant: 'day' | 'night';

  /** Reason for this selection */
  reason: 'monthly' | 'holiday' | 'fixed' | 'manual';

  /** If holiday, which one */
  holiday?: string;

  /** Next scheduled change time */
  nextChange?: string;

  /** What will change next (theme, variant, or both) */
  nextChangeType?: 'theme' | 'variant' | 'both';
}

/**
 * Default schedule configuration.
 */
export const DEFAULT_SCHEDULE: ThemeSchedule = {
  defaultMode: 'monthly',
  location: {
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
  dayNightEnabled: true,
  sunriseOffset: 0,
  sunsetOffset: 0,
  monthly: {
    1: 'january-frost',
    2: 'february-hearts',
    3: 'march-spring',
    4: 'april-rain',
    5: 'may-bloom',
    6: 'june-summer',
    7: 'july-fireworks',
    8: 'august-heat',
    9: 'september-harvest',
    10: 'october-autumn',
    11: 'november-cozy',
    12: 'december-winter',
  },
  holidays: [
    {
      name: 'Independence Day',
      theme: 'independence-day',
      startDate: '07-01',
      endDate: '07-07',
      enabled: true,
    },
    {
      name: 'Thanksgiving',
      theme: 'thanksgiving',
      startDate: '11-20',
      endDate: '11-30',
      enabled: true,
    },
    {
      name: 'Christmas',
      theme: 'christmas',
      startDate: '12-15',
      endDate: '12-26',
      enabled: true,
    },
    {
      name: 'New Year',
      theme: 'new-year',
      startDate: '12-30',
      endDate: '01-02',
      enabled: true,
    },
  ],
};

/**
 * Month names for display.
 */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Gets the month name from a month number (1-12).
 */
export function getMonthName(month: number): string {
  if (month < 1 || month > 12) return '';
  return MONTH_NAMES[month - 1];
}

/**
 * Parses a MM-DD date string and checks if a given date falls within a range.
 * Handles year boundaries (e.g., 12-30 to 01-02 spans New Year).
 */
export function isDateInRange(
  date: Date,
  startMD: string,
  endMD: string
): boolean {
  const [startMonth, startDay] = startMD.split('-').map(Number);
  const [endMonth, endDay] = endMD.split('-').map(Number);

  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();

  // Create comparison values (month * 100 + day for easy comparison)
  const current = currentMonth * 100 + currentDay;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  // Handle year boundary (e.g., Dec 30 to Jan 2)
  if (start > end) {
    // Spans year boundary
    return current >= start || current <= end;
  } else {
    // Normal range within same year
    return current >= start && current <= end;
  }
}

/**
 * Finds the active holiday for a given date.
 */
export function findActiveHoliday(
  date: Date,
  holidays: ThemeHoliday[]
): ThemeHoliday | undefined {
  return holidays.find((holiday) => {
    if (holiday.enabled === false) return false;
    if (holiday.year && holiday.year !== date.getFullYear()) return false;
    return isDateInRange(date, holiday.startDate, holiday.endDate);
  });
}

/**
 * Gets the theme ID for a given date based on schedule.
 */
export function getThemeForDate(
  date: Date,
  schedule: ThemeSchedule
): { themeId: string; reason: 'monthly' | 'holiday' | 'fixed'; holiday?: string } {
  // Check for fixed mode first
  if (schedule.defaultMode === 'fixed' && schedule.fixedTheme) {
    return { themeId: schedule.fixedTheme, reason: 'fixed' };
  }

  // Check for holiday overrides
  const activeHoliday = findActiveHoliday(date, schedule.holidays);
  if (activeHoliday) {
    return {
      themeId: activeHoliday.theme,
      reason: 'holiday',
      holiday: activeHoliday.name,
    };
  }

  // Fall back to monthly theme
  const month = date.getMonth() + 1;
  const monthlyTheme = schedule.monthly[month as keyof MonthlyThemes];

  return {
    themeId: monthlyTheme || 'default',
    reason: 'monthly',
  };
}

/**
 * Calculates the next theme change time.
 */
export function getNextThemeChange(
  currentDate: Date,
  schedule: ThemeSchedule
): { time: Date; type: 'theme' | 'variant'; reason: string } | null {
  // This is a simplified version - the full implementation would be in Rust
  // for accurate solar calculations

  // Check for upcoming holiday boundaries
  for (const holiday of schedule.holidays) {
    if (holiday.enabled === false) continue;

    const [startMonth, startDay] = holiday.startDate.split('-').map(Number);
    const startDate = new Date(
      currentDate.getFullYear(),
      startMonth - 1,
      startDay
    );

    if (startDate > currentDate) {
      return {
        time: startDate,
        type: 'theme',
        reason: `Holiday: ${holiday.name}`,
      };
    }

    const [endMonth, endDay] = holiday.endDate.split('-').map(Number);
    const endDate = new Date(
      currentDate.getFullYear(),
      endMonth - 1,
      endDay + 1
    );

    if (
      isDateInRange(currentDate, holiday.startDate, holiday.endDate) &&
      endDate > currentDate
    ) {
      return {
        time: endDate,
        type: 'theme',
        reason: `End of ${holiday.name}`,
      };
    }
  }

  // Check for month boundary
  const nextMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    1
  );
  return {
    time: nextMonth,
    type: 'theme',
    reason: `Monthly theme change`,
  };
}

/**
 * Validates a schedule configuration.
 */
export function validateSchedule(
  schedule: ThemeSchedule
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate location
  if (
    schedule.location.latitude < -90 ||
    schedule.location.latitude > 90
  ) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (
    schedule.location.longitude < -180 ||
    schedule.location.longitude > 180
  ) {
    errors.push('Longitude must be between -180 and 180');
  }

  // Validate holidays
  for (const holiday of schedule.holidays) {
    const datePattern = /^\d{2}-\d{2}$/;
    if (!datePattern.test(holiday.startDate)) {
      errors.push(
        `Invalid start date format for ${holiday.name}: ${holiday.startDate}`
      );
    }
    if (!datePattern.test(holiday.endDate)) {
      errors.push(
        `Invalid end date format for ${holiday.name}: ${holiday.endDate}`
      );
    }
    if (!holiday.theme) {
      errors.push(`No theme specified for ${holiday.name}`);
    }
  }

  // Validate monthly themes exist for current mode
  if (schedule.defaultMode === 'monthly') {
    const currentMonth = new Date().getMonth() + 1;
    if (!schedule.monthly[currentMonth as keyof MonthlyThemes]) {
      errors.push(`No theme assigned for current month (${getMonthName(currentMonth)})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
