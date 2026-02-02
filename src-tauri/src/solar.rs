//! Solar calculations module
//!
//! Provides sunrise/sunset calculations for day/night theme variant switching.
//! Uses the `sun` crate for accurate astronomical calculations.

use chrono::{DateTime, Datelike, Local, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

/// Geographic location for solar calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub latitude: f64,
    pub longitude: f64,
    pub timezone: String,
}

impl Default for Location {
    fn default() -> Self {
        Self {
            latitude: 40.7128,  // New York City
            longitude: -74.0060,
            timezone: "America/New_York".to_string(),
        }
    }
}

/// Solar times result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolarTimes {
    /// Sunrise time in ISO format
    pub sunrise: String,
    /// Sunset time in ISO format
    pub sunset: String,
    /// Solar noon in ISO format
    pub solar_noon: String,
    /// Day length in minutes
    pub day_length: i64,
    /// Whether it's currently daytime
    pub is_day: bool,
}

/// Calculate the approximate Julian date
fn to_julian(year: i32, month: u32, day: u32) -> f64 {
    let y = if month <= 2 { year - 1 } else { year } as f64;
    let m = if month <= 2 { month + 12 } else { month } as f64;
    let d = day as f64;

    let a = (y / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();

    (365.25 * (y + 4716.0)).floor() + (30.6001 * (m + 1.0)).floor() + d + b - 1524.5
}

/// Calculate solar times using the sunrise equation
/// This is a simplified but reasonably accurate calculation
fn calculate_solar_times(date: NaiveDate, lat: f64, lon: f64) -> (f64, f64, f64) {
    let jd = to_julian(date.year(), date.month(), date.day());
    let n = jd - 2451545.0; // Days since J2000.0

    // Mean solar noon
    let j_star = n - (lon / 360.0);

    // Solar mean anomaly
    let m = (357.5291 + 0.98560028 * j_star) % 360.0;
    let m_rad = m.to_radians();

    // Equation of the center
    let c = 1.9148 * m_rad.sin() + 0.0200 * (2.0 * m_rad).sin() + 0.0003 * (3.0 * m_rad).sin();

    // Ecliptic longitude
    let lambda = (m + c + 180.0 + 102.9372) % 360.0;
    let lambda_rad = lambda.to_radians();

    // Solar transit (noon)
    let j_transit = 2451545.0 + j_star + 0.0053 * m_rad.sin() - 0.0069 * (2.0 * lambda_rad).sin();

    // Declination of the sun
    let sin_delta = lambda_rad.sin() * 23.44_f64.to_radians().sin();
    let delta = sin_delta.asin();

    // Hour angle
    let lat_rad = lat.to_radians();
    let cos_omega = (-0.0145_f64.to_radians().sin() - lat_rad.sin() * delta.sin())
        / (lat_rad.cos() * delta.cos());

    // Clamp for polar regions
    let cos_omega = cos_omega.clamp(-1.0, 1.0);
    let omega = cos_omega.acos().to_degrees();

    // Calculate sunrise and sunset
    let j_rise = j_transit - (omega / 360.0);
    let j_set = j_transit + (omega / 360.0);

    (j_rise, j_transit, j_set)
}

/// Convert Julian date to DateTime
fn julian_to_datetime(jd: f64) -> DateTime<Utc> {
    let z = jd.floor();
    let f = jd - z;

    let a = if z < 2299161.0 {
        z
    } else {
        let alpha = ((z - 1867216.25) / 36524.25).floor();
        z + 1.0 + alpha - (alpha / 4.0).floor()
    };

    let b = a + 1524.0;
    let c = ((b - 122.1) / 365.25).floor();
    let d = (365.25 * c).floor();
    let e = ((b - d) / 30.6001).floor();

    let day = b - d - (30.6001 * e).floor();
    let month = if e < 14.0 { e - 1.0 } else { e - 13.0 };
    let year = if month > 2.0 { c - 4716.0 } else { c - 4715.0 };

    let hours = f * 24.0;
    let hour = hours.floor() as u32;
    let minutes = (hours - hour as f64) * 60.0;
    let minute = minutes.floor() as u32;
    let seconds = (minutes - minute as f64) * 60.0;
    let second = seconds.floor() as u32;

    let naive = NaiveDate::from_ymd_opt(year as i32, month as u32, day as u32)
        .unwrap()
        .and_hms_opt(hour, minute, second)
        .unwrap();

    DateTime::from_naive_utc_and_offset(naive, Utc)
}

/// Get solar times for a specific date and location
pub fn get_solar_times(date: NaiveDate, location: &Location) -> SolarTimes {
    let (j_rise, j_transit, j_set) = calculate_solar_times(date, location.latitude, location.longitude);

    let sunrise_utc = julian_to_datetime(j_rise);
    let sunset_utc = julian_to_datetime(j_set);
    let noon_utc = julian_to_datetime(j_transit);

    // Convert to local time
    let sunrise_local = sunrise_utc.with_timezone(&Local);
    let sunset_local = sunset_utc.with_timezone(&Local);
    let noon_local = noon_utc.with_timezone(&Local);

    let day_length = (j_set - j_rise) * 24.0 * 60.0;

    // Check if currently daytime
    let now = Local::now();
    let is_day = now >= sunrise_local && now < sunset_local;

    SolarTimes {
        sunrise: sunrise_local.format("%Y-%m-%dT%H:%M:%S%:z").to_string(),
        sunset: sunset_local.format("%Y-%m-%dT%H:%M:%S%:z").to_string(),
        solar_noon: noon_local.format("%Y-%m-%dT%H:%M:%S%:z").to_string(),
        day_length: day_length.round() as i64,
        is_day,
    }
}

/// Check if it's currently daytime at a location
pub fn is_daytime(location: &Location, sunrise_offset: i64, sunset_offset: i64) -> bool {
    let today = Local::now().date_naive();
    let (j_rise, _, j_set) = calculate_solar_times(today, location.latitude, location.longitude);

    let sunrise_utc = julian_to_datetime(j_rise);
    let sunset_utc = julian_to_datetime(j_set);

    // Apply offsets (in minutes)
    let sunrise_local = sunrise_utc.with_timezone(&Local) + chrono::Duration::minutes(sunrise_offset);
    let sunset_local = sunset_utc.with_timezone(&Local) + chrono::Duration::minutes(sunset_offset);

    let now = Local::now();
    now >= sunrise_local && now < sunset_local
}

/// Get the next sunrise or sunset time
pub fn get_next_transition(location: &Location, sunrise_offset: i64, sunset_offset: i64) -> (String, bool) {
    let now = Local::now();
    let today = now.date_naive();

    let (j_rise, _, j_set) = calculate_solar_times(today, location.latitude, location.longitude);

    let sunrise_utc = julian_to_datetime(j_rise);
    let sunset_utc = julian_to_datetime(j_set);

    let sunrise_local = sunrise_utc.with_timezone(&Local) + chrono::Duration::minutes(sunrise_offset);
    let sunset_local = sunset_utc.with_timezone(&Local) + chrono::Duration::minutes(sunset_offset);

    if now < sunrise_local {
        // Before sunrise, next transition is sunrise (to day)
        (sunrise_local.format("%Y-%m-%dT%H:%M:%S%:z").to_string(), true)
    } else if now < sunset_local {
        // After sunrise, before sunset, next transition is sunset (to night)
        (sunset_local.format("%Y-%m-%dT%H:%M:%S%:z").to_string(), false)
    } else {
        // After sunset, calculate tomorrow's sunrise
        let tomorrow = today + chrono::Duration::days(1);
        let (j_rise_tomorrow, _, _) = calculate_solar_times(tomorrow, location.latitude, location.longitude);
        let sunrise_tomorrow_utc = julian_to_datetime(j_rise_tomorrow);
        let sunrise_tomorrow_local = sunrise_tomorrow_utc.with_timezone(&Local) + chrono::Duration::minutes(sunrise_offset);
        (sunrise_tomorrow_local.format("%Y-%m-%dT%H:%M:%S%:z").to_string(), true)
    }
}

// Tauri commands

/// Get solar times for a location
#[tauri::command]
pub fn solar_get_times(
    latitude: f64,
    longitude: f64,
    timezone: String,
) -> Result<SolarTimes, String> {
    let location = Location {
        latitude,
        longitude,
        timezone,
    };

    let today = Local::now().date_naive();
    Ok(get_solar_times(today, &location))
}

/// Check if it's currently daytime
#[tauri::command]
pub fn solar_is_day(
    latitude: f64,
    longitude: f64,
    sunrise_offset: i64,
    sunset_offset: i64,
) -> Result<bool, String> {
    let location = Location {
        latitude,
        longitude,
        timezone: "".to_string(), // Not needed for this calculation
    };

    Ok(is_daytime(&location, sunrise_offset, sunset_offset))
}

/// Get the next day/night transition time
#[tauri::command]
pub fn solar_get_next_transition(
    latitude: f64,
    longitude: f64,
    sunrise_offset: i64,
    sunset_offset: i64,
) -> Result<(String, bool), String> {
    let location = Location {
        latitude,
        longitude,
        timezone: "".to_string(),
    };

    Ok(get_next_transition(&location, sunrise_offset, sunset_offset))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solar_times_new_york() {
        let location = Location::default();
        let date = NaiveDate::from_ymd_opt(2024, 6, 21).unwrap(); // Summer solstice
        let times = get_solar_times(date, &location);

        // Summer solstice should have long days (around 900+ minutes)
        assert!(times.day_length > 800, "Day length should be long on summer solstice");
    }

    #[test]
    fn test_is_daytime() {
        let location = Location::default();
        // This test might fail depending on when it's run
        // Just check that it doesn't panic
        let _ = is_daytime(&location, 0, 0);
    }
}
