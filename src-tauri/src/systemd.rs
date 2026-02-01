use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerStatus {
    pub name: String,
    pub enabled: bool,
    pub active: bool,
    pub next_run: Option<String>,
    pub last_run: Option<String>,
    pub last_result: Option<String>,
}


/// Run a systemctl command with --user flag
fn systemctl_user(args: &[&str]) -> Result<String, String> {
    let mut cmd = Command::new("systemctl");
    cmd.arg("--user");
    cmd.args(args);

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute systemctl: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Check if a timer is enabled
fn is_timer_enabled(timer: &str) -> bool {
    systemctl_user(&["is-enabled", timer])
        .map(|s| s.trim() == "enabled")
        .unwrap_or(false)
}

/// Check if a timer is active
fn is_timer_active(timer: &str) -> bool {
    systemctl_user(&["is-active", timer])
        .map(|s| s.trim() == "active")
        .unwrap_or(false)
}

/// Get timer property
fn get_timer_property(timer: &str, property: &str) -> Option<String> {
    systemctl_user(&["show", timer, "--property", property])
        .ok()
        .and_then(|s| {
            let line = s.trim();
            if line.contains('=') {
                let value = line.split('=').nth(1)?.trim();
                if value.is_empty() || value == "n/a" {
                    None
                } else {
                    Some(value.to_string())
                }
            } else {
                None
            }
        })
}

#[tauri::command]
pub fn systemd_list_timers() -> Result<Vec<TimerStatus>, String> {
    // Load config to get timer name
    let config = crate::restic::restic_load_config()?;
    let timer_name = &config.systemd.timer;
    let service_name = &config.systemd.service;

    let enabled = is_timer_enabled(timer_name);
    let active = is_timer_active(timer_name);

    let next_run = get_timer_property(timer_name, "NextElapseUSecRealtime");
    let last_run = get_timer_property(timer_name, "LastTriggerUSec");

    // Get last result from service
    let last_result = systemctl_user(&["show", service_name, "--property", "Result"])
        .ok()
        .and_then(|s| {
            let line = s.trim();
            if line.contains('=') {
                Some(line.split('=').nth(1)?.trim().to_string())
            } else {
                None
            }
        });

    let status = TimerStatus {
        name: timer_name.clone(),
        enabled,
        active,
        next_run,
        last_run,
        last_result,
    };

    println!("✓ Timer {}: enabled={}, active={}", timer_name, enabled, active);
    Ok(vec![status])
}

#[tauri::command]
pub fn systemd_get_timer_status(name: String) -> Result<TimerStatus, String> {
    let enabled = is_timer_enabled(&name);
    let active = is_timer_active(&name);
    let next_run = get_timer_property(&name, "NextElapseUSecRealtime");
    let last_run = get_timer_property(&name, "LastTriggerUSec");

    // Derive service name from timer name
    let service_name = name.replace(".timer", ".service");
    let last_result = systemctl_user(&["show", &service_name, "--property", "Result"])
        .ok()
        .and_then(|s| {
            let line = s.trim();
            if line.contains('=') {
                Some(line.split('=').nth(1)?.trim().to_string())
            } else {
                None
            }
        });

    Ok(TimerStatus {
        name,
        enabled,
        active,
        next_run,
        last_run,
        last_result,
    })
}

#[tauri::command]
pub fn systemd_enable_timer(name: String) -> Result<(), String> {
    let output = Command::new("systemctl")
        .args(["--user", "enable", "--now", &name])
        .output()
        .map_err(|e| format!("Failed to enable timer: {}", e))?;

    if output.status.success() {
        println!("✓ Enabled timer: {}", name);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to enable timer: {}", stderr))
    }
}

#[tauri::command]
pub fn systemd_disable_timer(name: String) -> Result<(), String> {
    let output = Command::new("systemctl")
        .args(["--user", "disable", "--now", &name])
        .output()
        .map_err(|e| format!("Failed to disable timer: {}", e))?;

    if output.status.success() {
        println!("✓ Disabled timer: {}", name);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to disable timer: {}", stderr))
    }
}

#[tauri::command]
pub fn systemd_get_logs(service: String, lines: u32) -> Result<Vec<String>, String> {
    let output = Command::new("journalctl")
        .args([
            "--user",
            "-u", &service,
            "-n", &lines.to_string(),
            "--no-pager",
            "-o", "short-iso",
        ])
        .output()
        .map_err(|e| format!("Failed to get logs: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let log_lines: Vec<String> = stdout.lines()
        .map(|s| s.to_string())
        .collect();

    println!("✓ Retrieved {} log lines for {}", log_lines.len(), service);
    Ok(log_lines)
}

#[tauri::command]
pub fn systemd_get_service_logs(lines: u32) -> Result<Vec<String>, String> {
    let config = crate::restic::restic_load_config()?;
    systemd_get_logs(config.systemd.service, lines)
}
