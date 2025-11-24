// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_content(path: String) -> Result<String, String> {
    println!("Reading file: {}", path); // Debug log
    fs::read_to_string(&path).map_err(|e| format!("Error reading file {}: {}", path, e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
