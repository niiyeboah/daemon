#[tauri::command]
pub async fn detect_os() -> Result<String, String> {
    Ok(std::env::consts::OS.to_string())
}
