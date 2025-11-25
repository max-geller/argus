// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
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
        .invoke_handler(tauri::generate_handler![
            greet,
            get_content,
            list_docs,
            read_hyprland_config,
            write_hyprland_config,
            reload_hyprland
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
