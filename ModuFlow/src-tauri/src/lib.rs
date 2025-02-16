// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn list_files() -> Result<Vec<String>, String> {
    use std::fs;
    use std::io;

    // Tente de lire le contenu du dossier courant
    let entries = fs::read_dir(".").map_err(|e| format!("Erreur lors de la lecture du dossier : {}", e))?;

    let mut files = Vec::new();

    // Parcourt chaque entrée du dossier
    for entry in entries {
        let entry = entry.map_err(|e| format!("Erreur lors de la lecture d'une entrée : {}", e))?;

        // Vérifie si l'entrée est bien un fichier
        if entry.file_type().map_err(|e| format!("Erreur lors de la récupération du type d'entrée : {}", e))?.is_file() {
            // Convertit le nom de fichier en String et l'ajoute à la liste
            if let Some(name) = entry.file_name().to_str() {
                files.push(name.to_string());
            }
        }
    }

    Ok(files)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
