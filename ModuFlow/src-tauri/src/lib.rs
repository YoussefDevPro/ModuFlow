use std::fs;
use std::path::{Path, PathBuf};
use serde::Serialize;

fn get_icon_path(path: &Path) -> String {
    let assets_base = PathBuf::from("../public/assets");

    if path.is_dir() {
        return assets_base.join("folder.svg").to_string_lossy().into_owned();
    }

    let extension = match path.extension().and_then(|s| s.to_str()) {
        Some(ext) => ext,
        None => return assets_base.join("unknown.svg").to_string_lossy().into_owned(),
    };

    let icon_path = assets_base.join(format!("{}.svg", extension));
    
    if icon_path.exists() {
        icon_path.to_string_lossy().into_owned()
    } else {
        assets_base.join("unknow.svg").to_string_lossy().into_owned()
    }
}

#[derive(Serialize)]
struct DirectoryItem {
    name: String,
    path: String,
    icon: String,
    is_dir: bool,
    children: Option<Vec<DirectoryItem>>,
    has_children: bool,
}

#[tauri::command]
fn read_directory_structure(path: String, depth: Option<u32>) -> Result<Vec<DirectoryItem>, String> {
    fn generate_structure(path: &Path, current_depth: u32, max_depth: u32) -> Vec<DirectoryItem> {
        let mut result = Vec::with_capacity(16); 
        
        if let Ok(entries) = fs::read_dir(path) {
            let entries: Vec<_> = entries
                .filter_map(Result::ok)
                .collect();
            
            for entry in entries {
                let full_path = entry.path();
                let metadata = match entry.metadata() {
                    Ok(meta) => meta,
                    Err(_) => continue, 
                };
                
                let is_dir = metadata.is_dir();
                let name = entry.file_name().to_string_lossy().into_owned();
                let icon_path = get_icon_path(&full_path);
                
                let has_children = if is_dir {
                    fs::read_dir(&full_path).map(|mut dir| dir.next().is_some()).unwrap_or(false)
                } else {
                    false
                };

                let children = if is_dir && current_depth < max_depth {
                    Some(generate_structure(&full_path, current_depth + 1, max_depth))
                } else {
                    None
                };

                result.push(DirectoryItem {
                    name,
                    path: full_path.to_string_lossy().into_owned(),
                    icon: icon_path,
                    is_dir,
                    children,
                    has_children,
                });
            }
        }

        result
    }

    let path = Path::new(&path);
    if path.is_dir() {
        Ok(generate_structure(path, 0, depth.unwrap_or(1)))
    } else {
        Err("The provided path is not a directory".to_string())
    }
}

#[tauri::command]
fn read_directory_contents(path: String) -> Result<Vec<DirectoryItem>, String> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }

    let mut items = Vec::with_capacity(16); 
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.filter_map(Result::ok) {
            let full_path = entry.path();
            let metadata = match entry.metadata() {
                Ok(meta) => meta,
                Err(_) => continue, 
            };
            
            let is_dir = metadata.is_dir();
            
            items.push(DirectoryItem {
                name: entry.file_name().to_string_lossy().into_owned(),
                path: full_path.to_string_lossy().into_owned(),
                icon: get_icon_path(&full_path),
                is_dir,
                children: None,
                has_children: if is_dir {
                    fs::read_dir(&full_path).map(|mut dir| dir.next().is_some()).unwrap_or(false)
                } else {
                    false
                },
            });
        }
    }

    Ok(items)
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
fn save_file_content(path: String, content: String) -> Result<(), String> {
    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_directory_structure,
            read_directory_contents,
            read_file_content,
            save_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
