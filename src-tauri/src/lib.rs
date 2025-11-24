// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
        .invoke_handler(tauri::generate_handler![greet, get_content, list_docs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
