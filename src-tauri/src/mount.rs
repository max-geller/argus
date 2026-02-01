use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MountStatus {
    pub mounted: bool,
    pub path: String,
    pub device: Option<String>,
    pub fs_type: Option<String>,
}

/// Check if a path is a mounted filesystem
fn is_mounted(path: &str) -> bool {
    let output = Command::new("mountpoint")
        .arg("-q")
        .arg(path)
        .status();

    match output {
        Ok(status) => status.success(),
        Err(_) => false,
    }
}

/// Get mount information for a path from /proc/mounts
fn get_mount_info(path: &str) -> Option<(String, String)> {
    let mounts = std::fs::read_to_string("/proc/mounts").ok()?;

    for line in mounts.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 3 && parts[1] == path {
            return Some((parts[0].to_string(), parts[2].to_string()));
        }
    }

    None
}

#[tauri::command]
pub fn mount_check_status(path: String) -> Result<MountStatus, String> {
    let expanded_path = if path.starts_with("~/") {
        if let Ok(home) = std::env::var("HOME") {
            path.replacen("~", &home, 1)
        } else {
            path.clone()
        }
    } else {
        path.clone()
    };

    let mounted = is_mounted(&expanded_path);
    let (device, fs_type) = if mounted {
        get_mount_info(&expanded_path)
            .map(|(d, f)| (Some(d), Some(f)))
            .unwrap_or((None, None))
    } else {
        (None, None)
    };

    let status = MountStatus {
        mounted,
        path: expanded_path,
        device,
        fs_type,
    };

    println!("✓ Mount status for {}: {}", path, if mounted { "mounted" } else { "not mounted" });
    Ok(status)
}

/// Check mount status using the path from restic config
#[tauri::command]
pub fn mount_check_nas_status() -> Result<MountStatus, String> {
    // Load config to get mount path
    let config = crate::restic::restic_load_config()?;
    mount_check_status(config.mount.path)
}
