//! Theme management module
//!
//! Handles theme CRUD operations, configuration generation for various apps,
//! and theme application (wallpaper changes, config updates).

use crate::solar::{self, Location};
use chrono::{Datelike, Local, NaiveDate};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

// ============================================================================
// Data Structures
// ============================================================================

/// Base color palette
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemePalette {
    pub base: String,
    pub mantle: String,
    pub crust: String,
    pub surface0: String,
    pub surface1: String,
    pub surface2: String,
    pub text: String,
    pub subtext0: String,
    pub subtext1: String,
    pub accent: String,
    pub secondary: String,
    pub red: String,
    pub green: String,
    pub yellow: String,
    pub blue: String,
    pub pink: String,
    pub teal: String,
}

/// Semantic token mappings (palette color references)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SemanticTokens {
    #[serde(default)]
    pub active_border: Option<String>,
    #[serde(default)]
    pub inactive_border: Option<String>,
    #[serde(default)]
    pub shadow: Option<String>,
    #[serde(default)]
    pub bar_background: Option<String>,
    #[serde(default)]
    pub bar_foreground: Option<String>,
    #[serde(default)]
    pub workspace_active: Option<String>,
    #[serde(default)]
    pub workspace_empty: Option<String>,
    #[serde(default)]
    pub primary: Option<String>,
    #[serde(default)]
    pub success: Option<String>,
    #[serde(default)]
    pub warning: Option<String>,
    #[serde(default)]
    pub error: Option<String>,
}

/// Theme variant (day or night)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeVariant {
    pub wallpaper: String,
    pub palette: ThemePalette,
    #[serde(default)]
    pub semantic_tokens: Option<SemanticTokens>,
}

/// App-specific configurations
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ThemeAppConfigs {
    #[serde(default)]
    pub hyprland: Option<HyprlandAppConfig>,
    #[serde(default)]
    pub waybar: Option<WaybarAppConfig>,
    #[serde(default)]
    pub kitty: Option<KittyAppConfig>,
    #[serde(default)]
    pub starship: Option<StarshipAppConfig>,
    #[serde(default)]
    pub rofi: Option<RofiAppConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HyprlandAppConfig {
    #[serde(default)]
    pub general: Option<HashMap<String, serde_json::Value>>,
    #[serde(default)]
    pub decoration: Option<HashMap<String, serde_json::Value>>,
    #[serde(default)]
    pub animations: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WaybarAppConfig {
    #[serde(default)]
    pub custom_css: Option<String>,
    #[serde(default)]
    pub modules: Option<HashMap<String, serde_json::Value>>,
    #[serde(default)]
    pub css_variables: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct KittyAppConfig {
    #[serde(default)]
    pub background_opacity: Option<String>,
    #[serde(default)]
    pub cursor: Option<String>,
    #[serde(default)]
    pub cursor_text_color: Option<String>,
    #[serde(default)]
    pub url_color: Option<String>,
    #[serde(default)]
    pub font_size: Option<f64>,
    #[serde(default)]
    pub font_family: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StarshipAppConfig {
    #[serde(default)]
    pub palette_name: Option<String>,
    #[serde(default)]
    pub extra_colors: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RofiAppConfig {
    #[serde(default)]
    pub border_width: Option<String>,
    #[serde(default)]
    pub border_radius: Option<String>,
    #[serde(default)]
    pub font: Option<String>,
    #[serde(default)]
    pub extra: Option<HashMap<String, String>>,
}

/// Complete theme definition
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    pub variants: ThemeVariants,
    #[serde(default)]
    pub apps: Option<ThemeAppConfigs>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub month: Option<u32>,
    #[serde(default)]
    pub is_holiday: Option<bool>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeVariants {
    pub day: ThemeVariant,
    #[serde(default)]
    pub night: Option<ThemeVariant>,
}

/// Theme metadata for listings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeMetadata {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub day_wallpaper: String,
    pub night_wallpaper: Option<String>,
    pub accent_color: String,
    pub tags: Option<Vec<String>>,
    pub month: Option<u32>,
    pub is_holiday: Option<bool>,
}

/// Holiday configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Holiday {
    pub name: String,
    pub theme: String,
    pub start_date: String,
    pub end_date: String,
    #[serde(default)]
    pub year: Option<i32>,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool {
    true
}

/// Monthly theme assignments
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MonthlyThemes {
    #[serde(rename = "1")]
    pub january: Option<String>,
    #[serde(rename = "2")]
    pub february: Option<String>,
    #[serde(rename = "3")]
    pub march: Option<String>,
    #[serde(rename = "4")]
    pub april: Option<String>,
    #[serde(rename = "5")]
    pub may: Option<String>,
    #[serde(rename = "6")]
    pub june: Option<String>,
    #[serde(rename = "7")]
    pub july: Option<String>,
    #[serde(rename = "8")]
    pub august: Option<String>,
    #[serde(rename = "9")]
    pub september: Option<String>,
    #[serde(rename = "10")]
    pub october: Option<String>,
    #[serde(rename = "11")]
    pub november: Option<String>,
    #[serde(rename = "12")]
    pub december: Option<String>,
}

impl MonthlyThemes {
    pub fn get(&self, month: u32) -> Option<&String> {
        match month {
            1 => self.january.as_ref(),
            2 => self.february.as_ref(),
            3 => self.march.as_ref(),
            4 => self.april.as_ref(),
            5 => self.may.as_ref(),
            6 => self.june.as_ref(),
            7 => self.july.as_ref(),
            8 => self.august.as_ref(),
            9 => self.september.as_ref(),
            10 => self.october.as_ref(),
            11 => self.november.as_ref(),
            12 => self.december.as_ref(),
            _ => None,
        }
    }
}

/// Theme schedule configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeSchedule {
    #[serde(default = "default_mode")]
    pub default_mode: String,
    pub location: Location,
    #[serde(default = "default_true")]
    pub day_night_enabled: bool,
    #[serde(default)]
    pub sunrise_offset: i64,
    #[serde(default)]
    pub sunset_offset: i64,
    pub monthly: MonthlyThemes,
    #[serde(default)]
    pub holidays: Vec<Holiday>,
    #[serde(default)]
    pub fixed_theme: Option<String>,
    #[serde(default)]
    pub fixed_variant: Option<String>,
}

fn default_mode() -> String {
    "monthly".to_string()
}

impl Default for ThemeSchedule {
    fn default() -> Self {
        Self {
            default_mode: "monthly".to_string(),
            location: Location::default(),
            day_night_enabled: true,
            sunrise_offset: 0,
            sunset_offset: 0,
            monthly: MonthlyThemes::default(),
            holidays: vec![],
            fixed_theme: None,
            fixed_variant: None,
        }
    }
}

/// Result of theme application
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeApplicationResult {
    pub success: bool,
    pub applied_to: Vec<String>,
    pub errors: Vec<AppError>,
    pub wallpaper_changed: bool,
    pub requires_restart: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    pub app: String,
    pub error: String,
}

/// Schedule evaluation result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleEvaluation {
    pub theme_id: String,
    pub variant: String,
    pub reason: String,
    pub holiday: Option<String>,
    pub next_change: Option<String>,
    pub next_change_type: Option<String>,
}

/// Currently active theme info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveThemeInfo {
    pub theme_id: String,
    pub theme_name: String,
    pub variant: String,
    pub wallpaper: String,
    pub accent_color: String,
    pub applied_at: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_themes_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let themes_dir = PathBuf::from(home).join(".config/argus/themes");

    if !themes_dir.exists() {
        fs::create_dir_all(&themes_dir)
            .map_err(|e| format!("Failed to create themes directory: {}", e))?;
    }

    Ok(themes_dir)
}

fn get_schedule_path() -> Result<PathBuf, String> {
    let themes_dir = get_themes_dir()?;
    Ok(themes_dir.join("schedule.json"))
}

fn get_active_theme_path() -> Result<PathBuf, String> {
    let themes_dir = get_themes_dir()?;
    Ok(themes_dir.join(".active.json"))
}

fn resolve_palette_ref(reference: &str, palette: &ThemePalette) -> Option<String> {
    match reference {
        "base" => Some(palette.base.clone()),
        "mantle" => Some(palette.mantle.clone()),
        "crust" => Some(palette.crust.clone()),
        "surface0" => Some(palette.surface0.clone()),
        "surface1" => Some(palette.surface1.clone()),
        "surface2" => Some(palette.surface2.clone()),
        "text" => Some(palette.text.clone()),
        "subtext0" => Some(palette.subtext0.clone()),
        "subtext1" => Some(palette.subtext1.clone()),
        "accent" => Some(palette.accent.clone()),
        "secondary" => Some(palette.secondary.clone()),
        "red" => Some(palette.red.clone()),
        "green" => Some(palette.green.clone()),
        "yellow" => Some(palette.yellow.clone()),
        "blue" => Some(palette.blue.clone()),
        "pink" => Some(palette.pink.clone()),
        "teal" => Some(palette.teal.clone()),
        _ => None,
    }
}

/// Replace {color} placeholders in a string with actual palette values
fn resolve_color_refs(template: &str, palette: &ThemePalette) -> String {
    let mut result = template.to_string();
    let color_refs = [
        "base", "mantle", "crust", "surface0", "surface1", "surface2", "text", "subtext0",
        "subtext1", "accent", "secondary", "red", "green", "yellow", "blue", "pink", "teal",
    ];

    for ref_name in &color_refs {
        let placeholder = format!("{{{}}}", ref_name);
        if let Some(color) = resolve_palette_ref(ref_name, palette) {
            result = result.replace(&placeholder, &color);
        }
    }

    result
}

/// Check if a date falls within a holiday range
fn is_date_in_holiday(date: &NaiveDate, holiday: &Holiday) -> bool {
    if !holiday.enabled {
        return false;
    }

    if let Some(year) = holiday.year {
        if date.year() != year {
            return false;
        }
    }

    let parts_start: Vec<u32> = holiday
        .start_date
        .split('-')
        .filter_map(|s| s.parse().ok())
        .collect();
    let parts_end: Vec<u32> = holiday
        .end_date
        .split('-')
        .filter_map(|s| s.parse().ok())
        .collect();

    if parts_start.len() != 2 || parts_end.len() != 2 {
        return false;
    }

    let (start_month, start_day) = (parts_start[0], parts_start[1]);
    let (end_month, end_day) = (parts_end[0], parts_end[1]);

    let current = date.month() * 100 + date.day();
    let start = start_month * 100 + start_day;
    let end = end_month * 100 + end_day;

    // Handle year boundary (e.g., Dec 30 to Jan 2)
    if start > end {
        current >= start || current <= end
    } else {
        current >= start && current <= end
    }
}

// ============================================================================
// Tauri Commands - Theme CRUD
// ============================================================================

/// List all available themes
#[tauri::command]
pub fn theme_list() -> Result<Vec<ThemeMetadata>, String> {
    let themes_dir = get_themes_dir()?;
    let mut themes = Vec::new();

    for entry in fs::read_dir(&themes_dir).map_err(|e| format!("Failed to read themes directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json")
            && !path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.starts_with('.') || n == "schedule.json")
                .unwrap_or(false)
        {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(theme) = serde_json::from_str::<Theme>(&content) {
                    themes.push(ThemeMetadata {
                        id: theme.id,
                        name: theme.name,
                        description: theme.description,
                        author: theme.author,
                        day_wallpaper: theme.variants.day.wallpaper.clone(),
                        night_wallpaper: theme.variants.night.as_ref().map(|n| n.wallpaper.clone()),
                        accent_color: theme.variants.day.palette.accent.clone(),
                        tags: theme.tags,
                        month: theme.month,
                        is_holiday: theme.is_holiday,
                    });
                }
            }
        }
    }

    themes.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(themes)
}

/// Get a theme by ID
#[tauri::command]
pub fn theme_get(id: String) -> Result<Theme, String> {
    let themes_dir = get_themes_dir()?;
    let theme_path = themes_dir.join(format!("{}.json", id));

    if !theme_path.exists() {
        return Err(format!("Theme not found: {}", id));
    }

    let content = fs::read_to_string(&theme_path)
        .map_err(|e| format!("Failed to read theme file: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse theme: {}", e))
}

/// Save a theme (create or update)
#[tauri::command]
pub fn theme_save(theme: Theme) -> Result<(), String> {
    let themes_dir = get_themes_dir()?;
    let theme_path = themes_dir.join(format!("{}.json", theme.id));

    let mut theme = theme;
    let now = Local::now().format("%Y-%m-%dT%H:%M:%S%:z").to_string();

    if !theme_path.exists() {
        theme.created_at = Some(now.clone());
    }
    theme.updated_at = Some(now);

    let content = serde_json::to_string_pretty(&theme)
        .map_err(|e| format!("Failed to serialize theme: {}", e))?;

    fs::write(&theme_path, content).map_err(|e| format!("Failed to write theme file: {}", e))
}

/// Delete a theme
#[tauri::command]
pub fn theme_delete(id: String) -> Result<(), String> {
    let themes_dir = get_themes_dir()?;
    let theme_path = themes_dir.join(format!("{}.json", id));

    if !theme_path.exists() {
        return Err(format!("Theme not found: {}", id));
    }

    fs::remove_file(&theme_path).map_err(|e| format!("Failed to delete theme: {}", e))
}

/// Get the currently active theme info
#[tauri::command]
pub fn theme_get_current() -> Result<Option<ActiveThemeInfo>, String> {
    let active_path = get_active_theme_path()?;

    if !active_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&active_path)
        .map_err(|e| format!("Failed to read active theme file: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse active theme: {}", e))
}

// ============================================================================
// Tauri Commands - Theme Application
// ============================================================================

/// Apply a theme with the specified variant
#[tauri::command]
pub fn theme_apply(id: String, variant: String) -> Result<ThemeApplicationResult, String> {
    let theme = theme_get(id.clone())?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    let mut result = ThemeApplicationResult {
        success: true,
        applied_to: Vec::new(),
        errors: Vec::new(),
        wallpaper_changed: false,
        requires_restart: Vec::new(),
    };

    // 1. Apply wallpaper via swaybg
    if !active_variant.wallpaper.is_empty() {
        match apply_wallpaper(&active_variant.wallpaper) {
            Ok(_) => {
                result.applied_to.push("wallpaper".to_string());
                result.wallpaper_changed = true;
            }
            Err(e) => {
                result.errors.push(AppError {
                    app: "wallpaper".to_string(),
                    error: e,
                });
            }
        }
    }

    // 2. Generate and apply Hyprland colors
    match generate_and_apply_hyprland(&theme, &active_variant.palette) {
        Ok(_) => result.applied_to.push("hyprland".to_string()),
        Err(e) => {
            result.errors.push(AppError {
                app: "hyprland".to_string(),
                error: e,
            });
        }
    }

    // 3. Generate Waybar CSS
    match generate_waybar_css(&theme, &active_variant.palette) {
        Ok(_) => result.applied_to.push("waybar".to_string()),
        Err(e) => {
            result.errors.push(AppError {
                app: "waybar".to_string(),
                error: e,
            });
        }
    }

    // 4. Generate Kitty colors
    match generate_kitty_conf(&theme, &active_variant.palette) {
        Ok(_) => {
            result.applied_to.push("kitty".to_string());
            result.requires_restart.push("kitty".to_string());
        }
        Err(e) => {
            result.errors.push(AppError {
                app: "kitty".to_string(),
                error: e,
            });
        }
    }

    // 5. Generate Starship palette
    match generate_starship_palette(&theme, &active_variant.palette) {
        Ok(_) => result.applied_to.push("starship".to_string()),
        Err(e) => {
            result.errors.push(AppError {
                app: "starship".to_string(),
                error: e,
            });
        }
    }

    // 6. Generate Rofi theme
    match generate_rofi_theme(&theme, &active_variant.palette) {
        Ok(_) => result.applied_to.push("rofi".to_string()),
        Err(e) => {
            result.errors.push(AppError {
                app: "rofi".to_string(),
                error: e,
            });
        }
    }

    // Save active theme info
    let active_info = ActiveThemeInfo {
        theme_id: id,
        theme_name: theme.name.clone(),
        variant: variant.clone(),
        wallpaper: active_variant.wallpaper.clone(),
        accent_color: active_variant.palette.accent.clone(),
        applied_at: Local::now().format("%Y-%m-%dT%H:%M:%S%:z").to_string(),
    };

    let active_path = get_active_theme_path()?;
    let active_json = serde_json::to_string_pretty(&active_info)
        .map_err(|e| format!("Failed to serialize active theme info: {}", e))?;
    fs::write(&active_path, active_json)
        .map_err(|e| format!("Failed to save active theme info: {}", e))?;

    result.success = result.errors.is_empty();
    Ok(result)
}

/// Preview a theme (generate configs but don't apply)
#[tauri::command]
pub fn theme_preview(id: String, variant: String) -> Result<HashMap<String, String>, String> {
    let theme = theme_get(id)?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    let mut previews = HashMap::new();

    // Generate preview configs without applying
    previews.insert(
        "hyprland".to_string(),
        generate_hyprland_config(&theme, &active_variant.palette),
    );
    previews.insert(
        "waybar_css".to_string(),
        generate_waybar_css_content(&theme, &active_variant.palette),
    );
    previews.insert(
        "kitty".to_string(),
        generate_kitty_content(&theme, &active_variant.palette),
    );
    previews.insert(
        "starship".to_string(),
        generate_starship_content(&theme, &active_variant.palette),
    );
    previews.insert(
        "rofi".to_string(),
        generate_rofi_content(&theme, &active_variant.palette),
    );

    Ok(previews)
}

// ============================================================================
// Tauri Commands - Schedule Management
// ============================================================================

/// Get the schedule configuration
#[tauri::command]
pub fn theme_get_schedule() -> Result<ThemeSchedule, String> {
    let schedule_path = get_schedule_path()?;

    if !schedule_path.exists() {
        return Ok(ThemeSchedule::default());
    }

    let content = fs::read_to_string(&schedule_path)
        .map_err(|e| format!("Failed to read schedule file: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse schedule: {}", e))
}

/// Save the schedule configuration
#[tauri::command]
pub fn theme_save_schedule(schedule: ThemeSchedule) -> Result<(), String> {
    let schedule_path = get_schedule_path()?;

    let content = serde_json::to_string_pretty(&schedule)
        .map_err(|e| format!("Failed to serialize schedule: {}", e))?;

    fs::write(&schedule_path, content).map_err(|e| format!("Failed to write schedule file: {}", e))
}

/// Get which theme should be active for the current date/time
#[tauri::command]
pub fn theme_get_active_for_date() -> Result<ScheduleEvaluation, String> {
    let schedule = theme_get_schedule()?;
    let now = Local::now();
    let today = now.date_naive();

    // Determine theme based on schedule
    let (theme_id, reason, holiday_name) = if schedule.default_mode == "fixed" {
        (
            schedule.fixed_theme.clone().unwrap_or_default(),
            "fixed".to_string(),
            None,
        )
    } else {
        // Check for holiday override
        let mut found_holiday: Option<&Holiday> = None;
        for holiday in &schedule.holidays {
            if is_date_in_holiday(&today, holiday) {
                found_holiday = Some(holiday);
                break;
            }
        }

        if let Some(holiday) = found_holiday {
            (
                holiday.theme.clone(),
                "holiday".to_string(),
                Some(holiday.name.clone()),
            )
        } else {
            // Use monthly theme
            let month = today.month();
            let monthly_theme = schedule.monthly.get(month).cloned().unwrap_or_default();
            (monthly_theme, "monthly".to_string(), None)
        }
    };

    // Determine variant
    let variant = if schedule.day_night_enabled {
        if solar::is_daytime(
            &schedule.location,
            schedule.sunrise_offset,
            schedule.sunset_offset,
        ) {
            "day"
        } else {
            "night"
        }
    } else {
        schedule.fixed_variant.as_deref().unwrap_or("day")
    };

    // Calculate next change
    let (next_change, next_change_type) = if schedule.day_night_enabled {
        let (next_time, _to_day) = solar::get_next_transition(
            &schedule.location,
            schedule.sunrise_offset,
            schedule.sunset_offset,
        );
        (Some(next_time), Some("variant".to_string()))
    } else {
        (None, None)
    };

    Ok(ScheduleEvaluation {
        theme_id,
        variant: variant.to_string(),
        reason,
        holiday: holiday_name,
        next_change,
        next_change_type,
    })
}

// ============================================================================
// Tauri Commands - Config Generation
// ============================================================================

/// Generate Hyprland color config
#[tauri::command]
pub fn theme_generate_hyprland(id: String, variant: String) -> Result<String, String> {
    let theme = theme_get(id)?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    Ok(generate_hyprland_config(&theme, &active_variant.palette))
}

/// Generate Waybar CSS
#[tauri::command]
pub fn theme_generate_waybar_css(id: String, variant: String) -> Result<String, String> {
    let theme = theme_get(id)?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    Ok(generate_waybar_css_content(&theme, &active_variant.palette))
}

/// Generate Kitty color config
#[tauri::command]
pub fn theme_generate_kitty_conf(id: String, variant: String) -> Result<String, String> {
    let theme = theme_get(id)?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    Ok(generate_kitty_content(&theme, &active_variant.palette))
}

/// Generate Starship palette
#[tauri::command]
pub fn theme_generate_starship_palette(id: String, variant: String) -> Result<String, String> {
    let theme = theme_get(id)?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    Ok(generate_starship_content(&theme, &active_variant.palette))
}

/// Generate Rofi theme file
#[tauri::command]
pub fn theme_generate_rofi_theme(id: String, variant: String) -> Result<String, String> {
    let theme = theme_get(id)?;
    let is_day = variant == "day";

    let active_variant = if is_day {
        &theme.variants.day
    } else {
        theme.variants.night.as_ref().unwrap_or(&theme.variants.day)
    };

    Ok(generate_rofi_content(&theme, &active_variant.palette))
}

// ============================================================================
// Config Generation Helpers
// ============================================================================

fn apply_wallpaper(wallpaper_path: &str) -> Result<(), String> {
    // Kill existing swaybg
    let _ = Command::new("pkill").arg("swaybg").output();

    // Start swaybg with new wallpaper
    Command::new("swaybg")
        .arg("-i")
        .arg(wallpaper_path)
        .arg("-m")
        .arg("fill")
        .spawn()
        .map_err(|e| format!("Failed to start swaybg: {}", e))?;

    Ok(())
}

fn generate_hyprland_config(theme: &Theme, palette: &ThemePalette) -> String {
    let mut config = String::new();

    config.push_str("# HyprPaper Theme Colors\n");
    config.push_str(&format!("# Theme: {}\n\n", theme.name));

    // General section
    config.push_str("general {\n");

    if let Some(apps) = &theme.apps {
        if let Some(hypr) = &apps.hyprland {
            if let Some(general) = &hypr.general {
                for (key, value) in general {
                    let resolved = if let Some(s) = value.as_str() {
                        resolve_color_refs(s, palette)
                    } else {
                        value.to_string()
                    };
                    config.push_str(&format!("    {} = {}\n", key, resolved));
                }
            }
        }
    }

    // Default colors if not specified
    if theme.apps.is_none()
        || theme.apps.as_ref().unwrap().hyprland.is_none()
        || theme
            .apps
            .as_ref()
            .unwrap()
            .hyprland
            .as_ref()
            .unwrap()
            .general
            .is_none()
    {
        config.push_str(&format!(
            "    col.active_border = {} {} 45deg\n",
            palette.accent, palette.secondary
        ));
        config.push_str(&format!("    col.inactive_border = {}\n", palette.surface1));
    }

    config.push_str("}\n\n");

    // Decoration section
    config.push_str("decoration {\n");
    config.push_str(&format!("    col.shadow = {}aa\n", palette.crust));
    config.push_str("}\n");

    config
}

fn generate_and_apply_hyprland(theme: &Theme, palette: &ThemePalette) -> Result<(), String> {
    let config = generate_hyprland_config(theme, palette);

    // Write to a theme-specific file
    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let colors_path = PathBuf::from(home).join(".config/hypr/colors.conf");

    fs::write(&colors_path, config)
        .map_err(|e| format!("Failed to write Hyprland colors: {}", e))?;

    // Reload Hyprland
    Command::new("hyprctl")
        .arg("reload")
        .output()
        .map_err(|e| format!("Failed to reload Hyprland: {}", e))?;

    Ok(())
}

fn generate_waybar_css_content(theme: &Theme, palette: &ThemePalette) -> String {
    let mut css = String::new();

    css.push_str(&format!("/* HyprPaper Theme: {} */\n\n", theme.name));

    // CSS Variables
    css.push_str(":root {\n");
    css.push_str(&format!("    --base: {};\n", palette.base));
    css.push_str(&format!("    --mantle: {};\n", palette.mantle));
    css.push_str(&format!("    --crust: {};\n", palette.crust));
    css.push_str(&format!("    --surface0: {};\n", palette.surface0));
    css.push_str(&format!("    --surface1: {};\n", palette.surface1));
    css.push_str(&format!("    --surface2: {};\n", palette.surface2));
    css.push_str(&format!("    --text: {};\n", palette.text));
    css.push_str(&format!("    --subtext0: {};\n", palette.subtext0));
    css.push_str(&format!("    --subtext1: {};\n", palette.subtext1));
    css.push_str(&format!("    --accent: {};\n", palette.accent));
    css.push_str(&format!("    --secondary: {};\n", palette.secondary));
    css.push_str(&format!("    --red: {};\n", palette.red));
    css.push_str(&format!("    --green: {};\n", palette.green));
    css.push_str(&format!("    --yellow: {};\n", palette.yellow));
    css.push_str(&format!("    --blue: {};\n", palette.blue));
    css.push_str(&format!("    --pink: {};\n", palette.pink));
    css.push_str(&format!("    --teal: {};\n", palette.teal));
    css.push_str("}\n\n");

    // Base styling
    css.push_str("* {\n");
    css.push_str("    font-family: \"JetBrainsMono Nerd Font\", monospace;\n");
    css.push_str("}\n\n");

    css.push_str("window#waybar {\n");
    css.push_str("    background: var(--base);\n");
    css.push_str("    color: var(--text);\n");
    css.push_str("}\n\n");

    // Workspaces
    css.push_str("#workspaces button {\n");
    css.push_str("    color: var(--subtext0);\n");
    css.push_str("    background: var(--surface0);\n");
    css.push_str("}\n\n");

    css.push_str("#workspaces button.active {\n");
    css.push_str("    color: var(--base);\n");
    css.push_str("    background: var(--accent);\n");
    css.push_str("}\n\n");

    css.push_str("#workspaces button.urgent {\n");
    css.push_str("    background: var(--red);\n");
    css.push_str("}\n\n");

    // Add custom CSS if specified
    if let Some(apps) = &theme.apps {
        if let Some(waybar) = &apps.waybar {
            if let Some(custom_css) = &waybar.custom_css {
                css.push_str("\n/* Custom theme CSS */\n");
                css.push_str(custom_css);
            }
        }
    }

    css
}

fn generate_waybar_css(theme: &Theme, palette: &ThemePalette) -> Result<(), String> {
    let css = generate_waybar_css_content(theme, palette);

    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let css_path = PathBuf::from(home).join(".config/waybar/theme.css");

    fs::write(&css_path, css).map_err(|e| format!("Failed to write Waybar CSS: {}", e))?;

    // Reload Waybar
    let _ = Command::new("pkill")
        .args(["-SIGUSR2", "waybar"])
        .output();

    Ok(())
}

fn generate_kitty_content(theme: &Theme, palette: &ThemePalette) -> String {
    let mut conf = String::new();

    conf.push_str(&format!("# HyprPaper Theme: {}\n\n", theme.name));

    // Basic colors
    conf.push_str(&format!("foreground {}\n", palette.text));
    conf.push_str(&format!("background {}\n", palette.base));
    conf.push_str(&format!("selection_foreground {}\n", palette.base));
    conf.push_str(&format!("selection_background {}\n", palette.surface2));

    // Cursor
    let cursor_color = if let Some(apps) = &theme.apps {
        if let Some(kitty) = &apps.kitty {
            if let Some(cursor) = &kitty.cursor {
                resolve_color_refs(cursor, palette)
            } else {
                palette.accent.clone()
            }
        } else {
            palette.accent.clone()
        }
    } else {
        palette.accent.clone()
    };
    conf.push_str(&format!("cursor {}\n", cursor_color));
    conf.push_str(&format!("cursor_text_color {}\n", palette.base));

    // URL color
    conf.push_str(&format!("url_color {}\n", palette.blue));

    // Tab bar colors
    conf.push_str(&format!("active_tab_foreground {}\n", palette.base));
    conf.push_str(&format!("active_tab_background {}\n", palette.accent));
    conf.push_str(&format!("inactive_tab_foreground {}\n", palette.subtext0));
    conf.push_str(&format!("inactive_tab_background {}\n", palette.surface0));

    // Terminal colors (16 colors)
    conf.push_str("\n# Terminal colors\n");
    conf.push_str(&format!("color0 {}\n", palette.surface0)); // black
    conf.push_str(&format!("color1 {}\n", palette.red)); // red
    conf.push_str(&format!("color2 {}\n", palette.green)); // green
    conf.push_str(&format!("color3 {}\n", palette.yellow)); // yellow
    conf.push_str(&format!("color4 {}\n", palette.blue)); // blue
    conf.push_str(&format!("color5 {}\n", palette.pink)); // magenta
    conf.push_str(&format!("color6 {}\n", palette.teal)); // cyan
    conf.push_str(&format!("color7 {}\n", palette.text)); // white
    conf.push_str(&format!("color8 {}\n", palette.surface1)); // bright black
    conf.push_str(&format!("color9 {}\n", palette.red)); // bright red
    conf.push_str(&format!("color10 {}\n", palette.green)); // bright green
    conf.push_str(&format!("color11 {}\n", palette.yellow)); // bright yellow
    conf.push_str(&format!("color12 {}\n", palette.blue)); // bright blue
    conf.push_str(&format!("color13 {}\n", palette.pink)); // bright magenta
    conf.push_str(&format!("color14 {}\n", palette.teal)); // bright cyan
    conf.push_str(&format!("color15 {}\n", palette.text)); // bright white

    // Background opacity
    if let Some(apps) = &theme.apps {
        if let Some(kitty) = &apps.kitty {
            if let Some(opacity) = &kitty.background_opacity {
                conf.push_str(&format!("\nbackground_opacity {}\n", opacity));
            }
        }
    }

    conf
}

fn generate_kitty_conf(theme: &Theme, palette: &ThemePalette) -> Result<(), String> {
    let conf = generate_kitty_content(theme, palette);

    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let conf_path = PathBuf::from(home).join(".config/kitty/theme.conf");

    fs::write(&conf_path, conf).map_err(|e| format!("Failed to write Kitty config: {}", e))
}

fn generate_starship_content(theme: &Theme, palette: &ThemePalette) -> String {
    let palette_name = if let Some(apps) = &theme.apps {
        if let Some(starship) = &apps.starship {
            starship
                .palette_name
                .clone()
                .unwrap_or_else(|| "theme".to_string())
        } else {
            "theme".to_string()
        }
    } else {
        "theme".to_string()
    };

    let mut toml = String::new();

    toml.push_str(&format!("# HyprPaper Theme: {}\n\n", theme.name));
    toml.push_str(&format!("palette = \"{}\"\n\n", palette_name));
    toml.push_str(&format!("[palettes.{}]\n", palette_name));
    toml.push_str(&format!("base = \"{}\"\n", palette.base));
    toml.push_str(&format!("mantle = \"{}\"\n", palette.mantle));
    toml.push_str(&format!("crust = \"{}\"\n", palette.crust));
    toml.push_str(&format!("surface0 = \"{}\"\n", palette.surface0));
    toml.push_str(&format!("surface1 = \"{}\"\n", palette.surface1));
    toml.push_str(&format!("surface2 = \"{}\"\n", palette.surface2));
    toml.push_str(&format!("text = \"{}\"\n", palette.text));
    toml.push_str(&format!("subtext0 = \"{}\"\n", palette.subtext0));
    toml.push_str(&format!("subtext1 = \"{}\"\n", palette.subtext1));
    toml.push_str(&format!("accent = \"{}\"\n", palette.accent));
    toml.push_str(&format!("secondary = \"{}\"\n", palette.secondary));
    toml.push_str(&format!("red = \"{}\"\n", palette.red));
    toml.push_str(&format!("green = \"{}\"\n", palette.green));
    toml.push_str(&format!("yellow = \"{}\"\n", palette.yellow));
    toml.push_str(&format!("blue = \"{}\"\n", palette.blue));
    toml.push_str(&format!("pink = \"{}\"\n", palette.pink));
    toml.push_str(&format!("teal = \"{}\"\n", palette.teal));

    // Add extra colors if specified
    if let Some(apps) = &theme.apps {
        if let Some(starship) = &apps.starship {
            if let Some(extra) = &starship.extra_colors {
                for (key, value) in extra {
                    toml.push_str(&format!("{} = \"{}\"\n", key, value));
                }
            }
        }
    }

    toml
}

fn generate_starship_palette(theme: &Theme, palette: &ThemePalette) -> Result<(), String> {
    let toml_content = generate_starship_content(theme, palette);

    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let toml_path = PathBuf::from(home).join(".config/starship-theme.toml");

    fs::write(&toml_path, toml_content)
        .map_err(|e| format!("Failed to write Starship palette: {}", e))
}

fn generate_rofi_content(theme: &Theme, palette: &ThemePalette) -> String {
    let mut rasi = String::new();

    rasi.push_str(&format!("/* HyprPaper Theme: {} */\n\n", theme.name));

    // Define colors
    rasi.push_str("* {\n");
    rasi.push_str(&format!("    base: {};\n", palette.base));
    rasi.push_str(&format!("    mantle: {};\n", palette.mantle));
    rasi.push_str(&format!("    crust: {};\n", palette.crust));
    rasi.push_str(&format!("    surface0: {};\n", palette.surface0));
    rasi.push_str(&format!("    surface1: {};\n", palette.surface1));
    rasi.push_str(&format!("    surface2: {};\n", palette.surface2));
    rasi.push_str(&format!("    text: {};\n", palette.text));
    rasi.push_str(&format!("    subtext0: {};\n", palette.subtext0));
    rasi.push_str(&format!("    subtext1: {};\n", palette.subtext1));
    rasi.push_str(&format!("    accent: {};\n", palette.accent));
    rasi.push_str(&format!("    secondary: {};\n", palette.secondary));
    rasi.push_str(&format!("    red: {};\n", palette.red));
    rasi.push_str(&format!("    green: {};\n", palette.green));
    rasi.push_str(&format!("    yellow: {};\n", palette.yellow));
    rasi.push_str(&format!("    blue: {};\n", palette.blue));
    rasi.push_str(&format!("    pink: {};\n", palette.pink));
    rasi.push_str(&format!("    teal: {};\n", palette.teal));
    rasi.push_str("\n");
    rasi.push_str("    background-color: @base;\n");
    rasi.push_str("    text-color: @text;\n");
    rasi.push_str("}\n\n");

    // Window
    rasi.push_str("window {\n");
    rasi.push_str("    background-color: @base;\n");
    rasi.push_str("    border: 2px;\n");
    rasi.push_str("    border-color: @accent;\n");
    rasi.push_str("    border-radius: 8px;\n");
    rasi.push_str("}\n\n");

    // Main box
    rasi.push_str("mainbox {\n");
    rasi.push_str("    background-color: @base;\n");
    rasi.push_str("}\n\n");

    // Input bar
    rasi.push_str("inputbar {\n");
    rasi.push_str("    background-color: @surface0;\n");
    rasi.push_str("    text-color: @text;\n");
    rasi.push_str("    border-radius: 4px;\n");
    rasi.push_str("    padding: 8px;\n");
    rasi.push_str("}\n\n");

    // List view
    rasi.push_str("listview {\n");
    rasi.push_str("    background-color: @base;\n");
    rasi.push_str("}\n\n");

    // Elements
    rasi.push_str("element {\n");
    rasi.push_str("    background-color: @base;\n");
    rasi.push_str("    text-color: @text;\n");
    rasi.push_str("    padding: 8px;\n");
    rasi.push_str("    border-radius: 4px;\n");
    rasi.push_str("}\n\n");

    rasi.push_str("element selected {\n");
    rasi.push_str("    background-color: @accent;\n");
    rasi.push_str("    text-color: @base;\n");
    rasi.push_str("}\n\n");

    rasi.push_str("element-icon {\n");
    rasi.push_str("    size: 24px;\n");
    rasi.push_str("}\n");

    rasi
}

fn generate_rofi_theme(theme: &Theme, palette: &ThemePalette) -> Result<(), String> {
    let rasi = generate_rofi_content(theme, palette);

    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let rofi_dir = PathBuf::from(&home).join(".config/rofi");
    let rasi_path = rofi_dir.join("theme.rasi");

    // Ensure rofi config directory exists
    if !rofi_dir.exists() {
        fs::create_dir_all(&rofi_dir)
            .map_err(|e| format!("Failed to create rofi config directory: {}", e))?;
    }

    fs::write(&rasi_path, rasi).map_err(|e| format!("Failed to write Rofi theme: {}", e))
}

// ============================================================================
// Tauri Commands - Systemd Timer Setup
// ============================================================================

/// Set up systemd timer for scheduled theme switching
#[tauri::command]
pub fn theme_setup_systemd_timer() -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|_| "Could not determine HOME directory")?;
    let systemd_user_dir = PathBuf::from(&home).join(".config/systemd/user");

    // Create directory if needed
    if !systemd_user_dir.exists() {
        fs::create_dir_all(&systemd_user_dir)
            .map_err(|e| format!("Failed to create systemd user directory: {}", e))?;
    }

    // Create service file
    let service_content = r#"[Unit]
Description=Argus Theme Switcher
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=/home/%u/.config/argus/scripts/theme-switch.sh auto

[Install]
WantedBy=default.target
"#;

    let service_path = systemd_user_dir.join("argus-theme.service");
    fs::write(&service_path, service_content)
        .map_err(|e| format!("Failed to write service file: {}", e))?;

    // Create timer file (runs every 5 minutes)
    let timer_content = r#"[Unit]
Description=Argus Theme Switcher Timer

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
"#;

    let timer_path = systemd_user_dir.join("argus-theme.timer");
    fs::write(&timer_path, timer_content)
        .map_err(|e| format!("Failed to write timer file: {}", e))?;

    // Reload systemd and enable timer
    Command::new("systemctl")
        .args(["--user", "daemon-reload"])
        .output()
        .map_err(|e| format!("Failed to reload systemd: {}", e))?;

    Command::new("systemctl")
        .args(["--user", "enable", "--now", "argus-theme.timer"])
        .output()
        .map_err(|e| format!("Failed to enable timer: {}", e))?;

    Ok("Systemd timer set up successfully".to_string())
}
