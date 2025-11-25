// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use walkdir::WalkDir;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_hyprland_config() -> Result<String, String> {
    println!("=== read_hyprland_config called ===");
    
    let config_path = match get_hyprland_config_path() {
        Ok(path) => {
            println!("✓ Config path resolved: {:?}", path);
            path
        }
        Err(e) => {
            eprintln!("✗ Failed to get config path: {}", e);
            return Err(e);
        }
    };
    
    match fs::read_to_string(&config_path) {
        Ok(content) => {
            println!("✓ Successfully read config ({} bytes)", content.len());
            Ok(content)
        }
        Err(e) => {
            eprintln!("✗ Failed to read config file: {}", e);
            Err(format!("Failed to read Hyprland config from {:?}: {}", config_path, e))
        }
    }
}

#[tauri::command]
fn write_hyprland_config(content: String) -> Result<(), String> {
    let config_path = get_hyprland_config_path()?;
    println!("Writing Hyprland config to: {:?}", config_path);
    
    // Create a backup before writing
    let backup_path = config_path.with_extension("conf.backup");
    if config_path.exists() {
        fs::copy(&config_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
    }
    
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write Hyprland config to {:?}: {}", config_path, e))
}

#[tauri::command]
fn reload_hyprland() -> Result<String, String> {
    println!("Reloading Hyprland configuration...");
    
    let output = Command::new("hyprctl")
        .arg("reload")
        .output()
        .map_err(|e| format!("Failed to execute hyprctl reload: {}", e))?;
    
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("hyprctl reload failed: {}", stderr))
    }
}

fn get_hyprland_config_path() -> Result<PathBuf, String> {
    println!("Getting Hyprland config path...");
    
    let home = match std::env::var("HOME") {
        Ok(h) => {
            println!("  HOME = {}", h);
            h
        }
        Err(e) => {
            eprintln!("  ✗ Could not read HOME env var: {}", e);
            return Err("Could not determine HOME directory".to_string());
        }
    };
    
    let config_path = PathBuf::from(&home).join(".config/hypr/hyprland.conf");
    println!("  Checking path: {:?}", config_path);
    
    if !config_path.exists() {
        eprintln!("  ✗ Config file does not exist!");
        return Err(format!("Hyprland config not found at {:?}", config_path));
    }
    
    println!("  ✓ Config file exists");
    Ok(config_path)
}

// Snapshot-related structures and functions

#[derive(Serialize, Deserialize, Clone)]
struct SnapshotMetadata {
    id: String,
    timestamp: u64,
    description: String,
    #[serde(rename = "configType")]
    config_type: String,
    filename: String,
}

fn get_snapshot_dir(config_type: &str) -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .map_err(|_| "Could not determine HOME directory".to_string())?;
    
    let snapshot_dir = PathBuf::from(home)
        .join(".config/argus")
        .join(config_type)
        .join("snapshots");
    
    // Create directory if it doesn't exist
    if !snapshot_dir.exists() {
        fs::create_dir_all(&snapshot_dir)
            .map_err(|e| format!("Failed to create snapshot directory: {}", e))?;
    }
    
    Ok(snapshot_dir)
}

fn sanitize_description(description: &str) -> String {
    description
        .chars()
        .map(|c| match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' => c,
            ' ' => '-',
            _ => '_',
        })
        .collect::<String>()
        .chars()
        .take(50)
        .collect()
}

#[tauri::command]
fn create_snapshot(config_type: String, description: String, content: String) -> Result<String, String> {
    println!("Creating snapshot for {}: {}", config_type, description);
    
    let snapshot_dir = get_snapshot_dir(&config_type)?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let sanitized_desc = sanitize_description(&description);
    let snapshot_id = format!("{}-{}", timestamp, sanitized_desc);
    let config_filename = format!("{}.conf", snapshot_id);
    let meta_filename = format!("{}.meta.json", snapshot_id);
    
    let config_path = snapshot_dir.join(&config_filename);
    let meta_path = snapshot_dir.join(&meta_filename);
    
    // Write config content
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write snapshot config: {}", e))?;
    
    // Write metadata
    let metadata = SnapshotMetadata {
        id: snapshot_id.clone(),
        timestamp,
        description,
        config_type,
        filename: config_filename,
    };
    
    let meta_json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    
    fs::write(&meta_path, meta_json)
        .map_err(|e| format!("Failed to write snapshot metadata: {}", e))?;
    
    println!("✓ Snapshot created: {}", snapshot_id);
    Ok(snapshot_id)
}

#[tauri::command]
fn list_snapshots(config_type: String) -> Result<Vec<SnapshotMetadata>, String> {
    println!("Listing snapshots for {}", config_type);
    
    let snapshot_dir = get_snapshot_dir(&config_type)?;
    
    if !snapshot_dir.exists() {
        return Ok(vec![]);
    }
    
    let mut snapshots = Vec::new();
    
    for entry in fs::read_dir(&snapshot_dir)
        .map_err(|e| format!("Failed to read snapshot directory: {}", e))? 
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        
        // Only process .meta.json files
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(meta_content) = fs::read_to_string(&path) {
                if let Ok(metadata) = serde_json::from_str::<SnapshotMetadata>(&meta_content) {
                    snapshots.push(metadata);
                }
            }
        }
    }
    
    // Sort by timestamp (newest first)
    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    println!("✓ Found {} snapshots", snapshots.len());
    Ok(snapshots)
}

#[tauri::command]
fn restore_snapshot(config_type: String, snapshot_id: String) -> Result<String, String> {
    println!("Restoring snapshot: {} ({})", snapshot_id, config_type);
    
    let snapshot_dir = get_snapshot_dir(&config_type)?;
    let config_filename = format!("{}.conf", snapshot_id);
    let config_path = snapshot_dir.join(&config_filename);
    
    if !config_path.exists() {
        return Err(format!("Snapshot not found: {}", snapshot_id));
    }
    
    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read snapshot: {}", e))?;
    
    println!("✓ Snapshot restored ({} bytes)", content.len());
    Ok(content)
}

#[tauri::command]
fn delete_snapshot(config_type: String, snapshot_id: String) -> Result<(), String> {
    println!("Deleting snapshot: {} ({})", snapshot_id, config_type);
    
    let snapshot_dir = get_snapshot_dir(&config_type)?;
    let config_filename = format!("{}.conf", snapshot_id);
    let meta_filename = format!("{}.meta.json", snapshot_id);
    
    let config_path = snapshot_dir.join(&config_filename);
    let meta_path = snapshot_dir.join(&meta_filename);
    
    // Delete config file
    if config_path.exists() {
        fs::remove_file(&config_path)
            .map_err(|e| format!("Failed to delete snapshot config: {}", e))?;
    }
    
    // Delete metadata file
    if meta_path.exists() {
        fs::remove_file(&meta_path)
            .map_err(|e| format!("Failed to delete snapshot metadata: {}", e))?;
    }
    
    println!("✓ Snapshot deleted");
    Ok(())
}

#[tauri::command]
fn get_content(path: String) -> Result<String, String> {
    println!("Reading file: {}", path);

    let resolved = resolve_path(path)?;

    fs::read_to_string(&resolved).map_err(|e| format!("Error reading file {:?}: {}", resolved, e))
}

fn resolve_path(input: String) -> Result<PathBuf, String> {
    let provided = PathBuf::from(&input);
    if provided.is_absolute() {
        return Ok(provided);
    }

    let config_dir = docs_root()?;

    Ok(config_dir.join(provided))
}

#[derive(Serialize)]
struct DocEntry {
    title: String,
    path: String,
    category: String,
}

#[tauri::command]
fn list_docs() -> Result<Vec<DocEntry>, String> {
    let root = docs_root()?;
    if !root.exists() {
        return Ok(vec![]);
    }

    let mut entries: Vec<DocEntry> = WalkDir::new(&root)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext.eq_ignore_ascii_case("md"))
                .unwrap_or(false)
        })
        .filter_map(|entry| {
            let path = entry.into_path();
            let relative = match path.strip_prefix(&root) {
                Ok(rel) => rel.to_path_buf(),
                Err(_) => return None,
            };
            Some((path, relative))
        })
        .map(|(abs, relative)| DocEntry {
            title: titleize(abs.file_stem().and_then(|stem| stem.to_str()).unwrap_or_default()),
            path: relative_to_string(&relative),
            category: relative
                .parent()
                .and_then(|parent| parent.components().next())
                .and_then(|component| component.as_os_str().to_str())
                .map(titleize)
                .unwrap_or_else(|| "General".to_string()),
        })
        .collect();

    entries.sort_by(|a, b| {
        a.category
            .cmp(&b.category)
            .then_with(|| a.title.cmp(&b.title))
    });

    Ok(entries)
}

fn docs_root() -> Result<PathBuf, String> {
    // Check if we are running in development (debug) mode
    #[cfg(debug_assertions)]
    {
        // In 'tauri dev', the current working directory is usually the project root.
        // We check for the local assets folder relative to the project root.
        if let Ok(cwd) = std::env::current_dir() {
            // Try standard project root path
            let dev_path = cwd.join("src/assets/docs");
            if dev_path.exists() {
                println!("Development Mode: Serving docs from {:?}", dev_path);
                return Ok(dev_path);
            } 
            
            // Try parent directory (if running from src-tauri)
            let parent_dev_path = cwd.parent().map(|p| p.join("src/assets/docs"));
            if let Some(path) = parent_dev_path {
                if path.exists() {
                    println!("Development Mode: Serving docs from {:?}", path);
                    return Ok(path);
                }
            }

            // Fallback logging if path isn't found
            println!("Development Mode: Could not find docs in {:?} or parent", dev_path);
        }
    }

    dirs::config_dir()
        .ok_or_else(|| "Could not determine config directory".to_string())
        .map(|config| config.join("argus/docs"))
}

fn relative_to_string(path: &Path) -> String {
    path.iter()
        .map(|segment| segment.to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

fn titleize(value: &str) -> String {
    value
        .replace(['_', '-'], " ")
        .split_whitespace()
        .map(capitalize_word)
        .collect::<Vec<_>>()
        .join(" ")
}

fn capitalize_word(word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        Some(first) => {
            let mut result = first.to_uppercase().collect::<String>();
            result.push_str(&chars.as_str().to_lowercase());
            result
        }
        None => String::new(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_content,
            list_docs,
            read_hyprland_config,
            write_hyprland_config,
            reload_hyprland,
            create_snapshot,
            list_snapshots,
            restore_snapshot,
            delete_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
