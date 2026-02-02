/**
 * Theme Models - Barrel Export
 *
 * Exports all theme-related models for the HyprPaper theming system.
 */

// Palette models - types
export type {
  ThemePalette,
  SemanticTokens,
} from './palette.model';

// Palette models - values
export {
  DEFAULT_SEMANTIC_TOKENS,
  resolveToken,
  resolveAllTokens,
  isValidHexColor,
  hexWithAlpha,
} from './palette.model';

// Theme models - types
export type {
  ThemeVariant,
  HyprlandAppConfig,
  WaybarAppConfig,
  KittyAppConfig,
  StarshipAppConfig,
  RofiAppConfig,
  ThemeAppConfigs,
  Theme,
  ThemeMetadata,
  ActiveThemeState,
  ThemeApplicationResult,
  ThemePreview,
} from './theme.model';

// Theme models - values
export {
  createDefaultTheme,
  createDefaultPalette,
  mergePalettes,
  themeToMetadata,
  getVariantForTime,
  validateTheme,
} from './theme.model';

// Schedule models - types
export type {
  ThemeLocation,
  ThemeHoliday,
  MonthlyThemes,
  ScheduleMode,
  ThemeSchedule,
  SolarTimes,
  ScheduleEvaluation,
} from './schedule.model';

// Schedule models - values
export {
  DEFAULT_SCHEDULE,
  MONTH_NAMES,
  getMonthName,
  isDateInRange,
  findActiveHoliday,
  getThemeForDate,
  getNextThemeChange,
  validateSchedule,
} from './schedule.model';
