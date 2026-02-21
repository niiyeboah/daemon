mod commands;

use commands::diagnostics;
use commands::ollama;
use commands::openclaw;
use commands::setup;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            ollama::ollama_check,
            ollama::ollama_list_models,
            ollama::ollama_pull_model,
            ollama::ollama_chat,
            ollama::ollama_running_models,
            setup::detect_os,
            setup::setup_check,
            setup::setup_init,
            setup::setup_alias,
            diagnostics::diagnostics_full,
            diagnostics::system_info,
            openclaw::openclaw_check,
            openclaw::openclaw_install,
            openclaw::openclaw_onboard,
            openclaw::openclaw_connect_whatsapp,
            openclaw::openclaw_configure_model,
            openclaw::openclaw_gateway_restart,
            openclaw::openclaw_get_api_keys,
            openclaw::openclaw_set_api_key,
            openclaw::openclaw_remove_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
