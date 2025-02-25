// Learn more about Tauri commands at https://tauri.app/develop/calling-rust

use std::fs;
use std::path::Path;
use std::collections::BTreeMap;
use serde_json::{Value, json};

#[tauri::command]
fn read_directory_structure(path: String) -> Value {
    let path = Path::new(&path);
    json!(scan_directory(path))
}

/// recursive function to build the tree
fn scan_directory(path: &Path) -> Value {
    let mut tree = BTreeMap::new();

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            let full_path = entry.path();

            if full_path.is_dir() {
                tree.insert(name, scan_directory(&full_path)); // recursive for folders
            } else {
                tree.insert(name, json!(full_path.to_string_lossy())); // full path for files
            }
        }
    }

    json!(tree)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_directory_structure])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
