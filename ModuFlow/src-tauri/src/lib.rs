use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileEntry>>, // Si c'est un dossier, il contient des fichiers
}

#[tauri::command]
fn list_files(directory: &str) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(directory);
    if !path.exists() {
        return Err("Le répertoire n'existe pas.".to_string());
    }
    let entries = get_entries(path);
    Ok(entries)
}

fn get_entries(path: &Path) -> Vec<FileEntry> {
    let mut entries = Vec::new();

    if let Ok(dir_entries) = fs::read_dir(path) {
        for entry in dir_entries.flatten() {
            let file_path = entry.path();
            let is_dir = file_path.is_dir();
            let children = if is_dir {
                Some(get_entries(&file_path)) // Liste récursive
            } else {
                None
            };
            entries.push(FileEntry {
                name: entry.file_name().to_string_lossy().to_string(),
                path: file_path.to_string_lossy().to_string(),
                is_dir,
                children,
            });
        }
    }

    entries
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
