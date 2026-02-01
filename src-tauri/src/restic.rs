use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use toml;

// ============================================================================
// Configuration Types (matching restic-tui config.toml)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResticConfig {
    pub repository: RepositoryConfig,
    pub mount: MountConfig,
    pub backup: BackupConfig,
    pub systemd: SystemdConfig,
    pub retention: RetentionConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryConfig {
    pub path: String,
    pub password_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MountConfig {
    pub path: String,
    pub auto_mount: bool,
    pub mount_command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupConfig {
    #[serde(default)]
    pub script: Option<String>,
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub excludes: Vec<String>,
    #[serde(default)]
    pub tag: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemdConfig {
    pub timer: String,
    pub service: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionConfig {
    pub daily: i32,
    pub weekly: i32,
    pub monthly: i32,
}

impl Default for ResticConfig {
    fn default() -> Self {
        Self {
            repository: RepositoryConfig {
                path: "/media/nas_backup/restic-repo".to_string(),
                password_file: "~/.config/restic/password.txt".to_string(),
            },
            mount: MountConfig {
                path: "/media/nas_backup".to_string(),
                auto_mount: true,
                mount_command: "sudo mount /media/nas_backup".to_string(),
            },
            backup: BackupConfig {
                script: None,
                paths: vec![
                    "~/.config".to_string(),
                    "~/.local/bin".to_string(),
                ],
                excludes: vec![
                    "*.cache".to_string(),
                    "node_modules".to_string(),
                    ".venv".to_string(),
                ],
                tag: "fedora".to_string(),
            },
            systemd: SystemdConfig {
                timer: "restic-backup.timer".to_string(),
                service: "restic-backup.service".to_string(),
            },
            retention: RetentionConfig {
                daily: 7,
                weekly: 4,
                monthly: 6,
            },
        }
    }
}

// ============================================================================
// Restic Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub id: String,
    pub short_id: String,
    pub time: String,
    pub hostname: String,
    pub paths: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoStats {
    pub total_size: u64,
    #[serde(alias = "total_blob_count")]
    pub total_file_count: u64,
    #[serde(default)]
    pub snapshots_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub path: String,
    #[serde(default)]
    pub size: Option<u64>,
    #[serde(default)]
    pub mtime: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub added: Vec<String>,
    pub removed: Vec<String>,
    pub modified: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrunePreview {
    pub keep: Vec<String>,
    pub remove: Vec<String>,
    pub total_to_remove: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreRequest {
    pub snapshot_id: String,
    pub source_paths: Vec<String>,
    pub target_dir: String,
    pub overwrite: bool,
}


// ============================================================================
// Helper Functions
// ============================================================================

fn get_config_path() -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .map_err(|_| "Could not determine HOME directory".to_string())?;
    Ok(PathBuf::from(home).join(".config/restic-tui/config.toml"))
}

fn expand_path(path: &str) -> String {
    if path.starts_with("~/") {
        if let Ok(home) = std::env::var("HOME") {
            return path.replacen("~", &home, 1);
        }
    }
    path.to_string()
}

fn get_env_vars(config: &ResticConfig) -> Vec<(String, String)> {
    vec![
        ("RESTIC_REPOSITORY".to_string(), expand_path(&config.repository.path)),
        ("RESTIC_PASSWORD_FILE".to_string(), expand_path(&config.repository.password_file)),
    ]
}

fn run_restic_command(config: &ResticConfig, args: &[&str]) -> Result<String, String> {
    let mut cmd = Command::new("restic");
    cmd.args(args);

    for (key, value) in get_env_vars(config) {
        cmd.env(&key, &value);
    }

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute restic: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Restic command failed: {}", stderr))
    }
}


// ============================================================================
// Tauri Commands - Config
// ============================================================================

#[tauri::command]
pub fn restic_load_config() -> Result<ResticConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        println!("Config not found, returning default");
        return Ok(ResticConfig::default());
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    let config: ResticConfig = toml::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    println!("✓ Loaded restic config from {:?}", config_path);
    Ok(config)
}

#[tauri::command]
pub fn restic_save_config(config: ResticConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    // Ensure directory exists
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let content = toml::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    println!("✓ Saved restic config to {:?}", config_path);
    Ok(())
}

// ============================================================================
// Tauri Commands - Snapshots
// ============================================================================

#[tauri::command]
pub fn restic_list_snapshots() -> Result<Vec<Snapshot>, String> {
    let config = restic_load_config()?;

    let output = run_restic_command(&config, &["snapshots", "--json"])?;

    let snapshots: Vec<Snapshot> = serde_json::from_str(&output)
        .map_err(|e| format!("Failed to parse snapshots: {}", e))?;

    println!("✓ Listed {} snapshots", snapshots.len());
    Ok(snapshots)
}

#[tauri::command]
pub fn restic_create_backup(name: Option<String>) -> Result<Snapshot, String> {
    let config = restic_load_config()?;

    // Filter paths to only existing ones
    let existing_paths: Vec<String> = config.backup.paths.iter()
        .map(|p| expand_path(p))
        .filter(|p| std::path::Path::new(p).exists())
        .collect();

    // If user provided a name OR paths are configured, use direct restic (for proper tagging)
    // Only fall back to script if no name and no paths
    let use_direct_restic = name.is_some() || !existing_paths.is_empty();

    if use_direct_restic && !existing_paths.is_empty() {
        // Use restic directly - this allows proper tagging
        println!("Running restic backup directly with {} paths...", existing_paths.len());

        let mut cmd = Command::new("restic");
        cmd.arg("backup")
           .arg("--verbose");

        // Add tags (matching restic-tui convention)
        cmd.arg("--tag").arg("manual");
        if !config.backup.tag.is_empty() {
            cmd.arg("--tag").arg(&config.backup.tag);
        }
        if let Some(ref n) = name {
            cmd.arg("--tag").arg(format!("name:{}", n));
        }

        // Add excludes
        for exclude in &config.backup.excludes {
            cmd.arg("--exclude").arg(exclude);
        }

        // Add paths
        for path in &existing_paths {
            cmd.arg(path);
        }

        // Set environment
        for (key, value) in get_env_vars(&config) {
            cmd.env(&key, &value);
        }

        let output = cmd.output()
            .map_err(|e| format!("Failed to execute backup: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Backup failed: {}", stderr));
        }

        // Get the latest snapshot to return
        let snapshots = restic_list_snapshots()?;
        return snapshots.into_iter().next()
            .ok_or_else(|| "Backup succeeded but could not find snapshot".to_string());
    }

    // Fall back to script if available - pass name via environment variable
    if let Some(ref script) = config.backup.script {
        let script_path = expand_path(script);
        if std::path::Path::new(&script_path).exists() {
            println!("Running backup script: {}", script_path);

            let mut cmd = Command::new(&script_path);

            // Set environment for restic
            for (key, value) in get_env_vars(&config) {
                cmd.env(&key, &value);
            }

            // Mark as manual backup from Argus (so script uses "manual" tag instead of "AUTO_scheduled")
            cmd.env("ARGUS_MANUAL_BACKUP", "true");

            // Pass backup name via environment variable (script will add name:X tag)
            if let Some(ref n) = name {
                cmd.env("ARGUS_BACKUP_NAME", n);
                println!("Creating named backup: {}", n);
            }

            let output = cmd.output()
                .map_err(|e| format!("Failed to execute backup script: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("Backup script failed: {}", stderr));
            }

            // Get the latest snapshot to return
            let snapshots = restic_list_snapshots()?;
            return snapshots.into_iter().next()
                .ok_or_else(|| "Backup succeeded but could not find snapshot".to_string());
        }
    }

    Err("No backup paths configured. Add paths in Settings tab to enable named backups.".to_string())
}

#[tauri::command]
pub fn restic_delete_snapshots(ids: Vec<String>) -> Result<(), String> {
    if ids.is_empty() {
        return Ok(());
    }

    let config = restic_load_config()?;

    let mut args: Vec<&str> = vec!["forget"];
    for id in &ids {
        args.push(id.as_str());
    }

    run_restic_command(&config, &args)?;

    println!("✓ Deleted {} snapshots", ids.len());
    Ok(())
}

// ============================================================================
// Tauri Commands - Browsing & Restore
// ============================================================================

#[tauri::command]
pub fn restic_browse_snapshot(id: String, path: String) -> Result<Vec<FileNode>, String> {
    let config = restic_load_config()?;

    let mut args = vec!["ls", "--json", id.as_str()];
    let path_arg;
    if !path.is_empty() {
        path_arg = path.clone();
        args.push(path_arg.as_str());
    }

    let output = run_restic_command(&config, &args)?;

    // restic ls --json outputs one JSON object per line
    let mut files: Vec<FileNode> = Vec::new();
    for line in output.lines() {
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(node) = serde_json::from_str::<FileNode>(line) {
            // Filter to only include items at the current path level
            if !node.name.is_empty() {
                files.push(node);
            }
        }
    }

    println!("✓ Listed {} files in snapshot {}", files.len(), id);
    Ok(files)
}

#[tauri::command]
pub fn restic_restore(request: RestoreRequest) -> Result<(), String> {
    let config = restic_load_config()?;

    let target = expand_path(&request.target_dir);

    // Ensure target directory exists
    std::fs::create_dir_all(&target)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;

    let mut args = vec!["restore", request.snapshot_id.as_str(), "--target", target.as_str()];

    // Add include patterns for specific paths
    let include_args: Vec<String> = request.source_paths.iter()
        .map(|p| format!("--include={}", p))
        .collect();

    for arg in &include_args {
        args.push(arg.as_str());
    }

    run_restic_command(&config, &args)?;

    println!("✓ Restored {} paths to {}", request.source_paths.len(), target);
    Ok(())
}

// ============================================================================
// Tauri Commands - Diff
// ============================================================================

#[tauri::command]
pub fn restic_diff_snapshots(id1: String, id2: String) -> Result<DiffResult, String> {
    let config = restic_load_config()?;

    let output = run_restic_command(&config, &["diff", id1.as_str(), id2.as_str()])?;

    let mut result = DiffResult {
        added: Vec::new(),
        removed: Vec::new(),
        modified: Vec::new(),
    };

    for line in output.lines() {
        if line.len() < 2 {
            continue;
        }

        let modifier = &line[0..1];
        let path = line[1..].trim().to_string();

        match modifier {
            "+" => result.added.push(path),
            "-" => result.removed.push(path),
            "M" => result.modified.push(path),
            _ => {}
        }
    }

    println!("✓ Diff: +{} -{} M{}", result.added.len(), result.removed.len(), result.modified.len());
    Ok(result)
}

// ============================================================================
// Tauri Commands - Repository
// ============================================================================

#[tauri::command]
pub fn restic_get_stats() -> Result<RepoStats, String> {
    let config = restic_load_config()?;

    let output = run_restic_command(&config, &["stats", "--json", "--mode", "raw-data"])?;

    let mut stats: RepoStats = serde_json::from_str(&output)
        .map_err(|e| format!("Failed to parse stats: {}", e))?;

    // Get snapshot count
    if let Ok(snapshots) = restic_list_snapshots() {
        stats.snapshots_count = snapshots.len() as u64;
    }

    println!("✓ Got repo stats: {} bytes, {} files, {} snapshots",
             stats.total_size, stats.total_file_count, stats.snapshots_count);
    Ok(stats)
}

#[tauri::command]
pub fn restic_check_repo() -> Result<CheckResult, String> {
    let config = restic_load_config()?;

    match run_restic_command(&config, &["check"]) {
        Ok(output) => Ok(CheckResult {
            success: true,
            message: output,
        }),
        Err(e) => Ok(CheckResult {
            success: false,
            message: e,
        }),
    }
}

#[tauri::command]
pub fn restic_unlock_repo() -> Result<(), String> {
    let config = restic_load_config()?;
    run_restic_command(&config, &["unlock"])?;
    println!("✓ Unlocked repository");
    Ok(())
}

#[tauri::command]
pub fn restic_prune_preview() -> Result<PrunePreview, String> {
    let config = restic_load_config()?;

    let args = [
        "forget",
        "--dry-run",
        "--json",
        &format!("--keep-daily={}", config.retention.daily),
        &format!("--keep-weekly={}", config.retention.weekly),
        &format!("--keep-monthly={}", config.retention.monthly),
    ];

    let output = run_restic_command(&config, &args)?;

    // Parse the forget dry-run output
    let parsed: serde_json::Value = serde_json::from_str(&output)
        .unwrap_or(serde_json::Value::Array(vec![]));

    let mut keep: Vec<String> = Vec::new();
    let mut remove: Vec<String> = Vec::new();

    if let Some(groups) = parsed.as_array() {
        for group in groups {
            if let Some(keep_arr) = group.get("keep").and_then(|k| k.as_array()) {
                for snap in keep_arr {
                    if let Some(id) = snap.get("short_id").and_then(|i| i.as_str()) {
                        keep.push(id.to_string());
                    }
                }
            }
            if let Some(remove_arr) = group.get("remove").and_then(|r| r.as_array()) {
                for snap in remove_arr {
                    if let Some(id) = snap.get("short_id").and_then(|i| i.as_str()) {
                        remove.push(id.to_string());
                    }
                }
            }
        }
    }

    let total_to_remove = remove.len() as u64;

    println!("✓ Prune preview: keep {}, remove {}", keep.len(), total_to_remove);
    Ok(PrunePreview { keep, remove, total_to_remove })
}

#[tauri::command]
pub fn restic_prune() -> Result<(), String> {
    let config = restic_load_config()?;

    let args = [
        "forget",
        "--prune",
        &format!("--keep-daily={}", config.retention.daily),
        &format!("--keep-weekly={}", config.retention.weekly),
        &format!("--keep-monthly={}", config.retention.monthly),
    ];

    run_restic_command(&config, &args)?;

    println!("✓ Pruned repository");
    Ok(())
}
