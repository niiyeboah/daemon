mod commands;

use commands::ollama;
use commands::setup;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            ollama::ollama_check,
            ollama::ollama_list_models,
            ollama::ollama_pull_model,
            ollama::ollama_chat,
            setup::detect_os,
            setup::setup_check,
            setup::setup_init,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
