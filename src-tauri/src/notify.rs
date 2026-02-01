use std::process::Command;

/// Send a desktop notification using notify-send
#[tauri::command]
pub fn send_notification(title: String, body: String) -> Result<(), String> {
    let output = Command::new("notify-send")
        .arg("--app-name=Argus")
        .arg("--icon=dialog-information")
        .arg(&title)
        .arg(&body)
        .output()
        .map_err(|e| format!("Failed to send notification: {}", e))?;

    if output.status.success() {
        println!("✓ Sent notification: {}", title);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("notify-send failed: {}", stderr))
    }
}

/// Send a notification with urgency level
#[tauri::command]
pub fn send_notification_with_urgency(title: String, body: String, urgency: String) -> Result<(), String> {
    // Validate urgency level
    let urgency_level = match urgency.to_lowercase().as_str() {
        "low" => "low",
        "normal" => "normal",
        "critical" => "critical",
        _ => "normal",
    };

    let output = Command::new("notify-send")
        .arg("--app-name=Argus")
        .arg("--icon=dialog-information")
        .arg(format!("--urgency={}", urgency_level))
        .arg(&title)
        .arg(&body)
        .output()
        .map_err(|e| format!("Failed to send notification: {}", e))?;

    if output.status.success() {
        println!("✓ Sent {} notification: {}", urgency_level, title);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("notify-send failed: {}", stderr))
    }
}

/// Send a backup completion notification
#[tauri::command]
pub fn send_backup_notification(snapshot_id: String, success: bool, message: Option<String>) -> Result<(), String> {
    let (title, body, urgency) = if success {
        (
            "Backup Completed".to_string(),
            format!("Snapshot {} created successfully.{}",
                    &snapshot_id[..8.min(snapshot_id.len())],
                    message.map(|m| format!(" {}", m)).unwrap_or_default()),
            "normal"
        )
    } else {
        (
            "Backup Failed".to_string(),
            message.unwrap_or_else(|| "An error occurred during backup.".to_string()),
            "critical"
        )
    };

    let icon = if success { "dialog-information" } else { "dialog-error" };

    let output = Command::new("notify-send")
        .arg("--app-name=Argus")
        .arg(format!("--icon={}", icon))
        .arg(format!("--urgency={}", urgency))
        .arg(&title)
        .arg(&body)
        .output()
        .map_err(|e| format!("Failed to send notification: {}", e))?;

    if output.status.success() {
        println!("✓ Sent backup notification: {} - {}", title, body);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("notify-send failed: {}", stderr))
    }
}
