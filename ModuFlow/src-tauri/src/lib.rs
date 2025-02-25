// Learn more about Tauri commands at https://tauri.app/develop/calling-rust

use std::fs;
use std::path::Path;
use std::collections::BTreeMap;
use serde_json::{Value, json};
use std::path::PathBuf;

#[tauri::command]
fn read_directory_structure(path: String) -> Value {
    let path = Path::new(&path);
    json!(scan_directory(path))
}

fn get_icon_path(file_name: &str) -> String {
    if Path::new(file_name).is_dir() {
        return String::from("assets/folder.svg");
    }

    let extension = Path::new(file_name)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");

    let icon_path = PathBuf::from("assets").join(format!("{}.svg", extension));
    
    if icon_path.exists() {
        icon_path.to_string_lossy().to_string()
    } else {
        String::from("assets/unknown.svg")
    }
}

fn scan_directory(path: &Path) -> Value {
    let mut tree = BTreeMap::new();

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            let full_path = entry.path();
            let icon_path = get_icon_path(&name);

            if full_path.is_dir() {
                tree.insert(name, json!({
                    "type": "directory",
                    "icon": icon_path,
                    "content": scan_directory(&full_path)
                }));
            } else {
                tree.insert(name, json!({
                    "type": "file",
                    "icon": icon_path,
                    "path": full_path.to_string_lossy()
                }));
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
