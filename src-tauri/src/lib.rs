// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::path::PathBuf;

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

    let config_dir = dirs::config_dir()
        .ok_or_else(|| "Could not determine config directory".to_string())?
        .join("argus/docs");

    Ok(config_dir.join(provided))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
