use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SetupStatus {
    pub ollama_found: bool,
    pub ollama_path: Option<String>,
    pub output: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SetupLogEvent {
    pub line: String,
    pub stream: String, // "stdout" or "stderr"
}

#[tauri::command]
pub async fn detect_os() -> Result<String, String> {
    Ok(std::env::consts::OS.to_string())
}

#[tauri::command]
pub async fn setup_check(app: AppHandle) -> Result<SetupStatus, String> {
    let shell = app.shell();

    let output = shell
        .sidecar("daemon-setup")
        .map_err(|e| format!("Failed to create sidecar: {}", e))?
        .args(["check", "--skip-api"])
        .output()
        .await
        .map_err(|e| format!("Failed to run daemon-setup check: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}{}", stdout, stderr);

    let ollama_found = stdout.contains("Ollama found:");
    let ollama_path = if ollama_found {
        stdout
            .lines()
            .find(|l| l.contains("Ollama found:"))
            .map(|l| l.replace("Ollama found: ", "").trim().to_string())
    } else {
        None
    };

    Ok(SetupStatus {
        ollama_found,
        ollama_path,
        output: combined,
    })
}

#[tauri::command]
pub async fn setup_init(app: AppHandle) -> Result<(), String> {
    let shell = app.shell();

    let args = vec!["init"];

    let (mut rx, _child) = shell
        .sidecar("daemon-setup")
        .map_err(|e| format!("Failed to create sidecar: {}", e))?
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to spawn daemon-setup init: {}", e))?;

    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                let line = String::from_utf8_lossy(&line).to_string();
                let _ = app.emit(
                    "setup-log",
                    SetupLogEvent {
                        line,
                        stream: "stdout".to_string(),
                    },
                );
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                let line = String::from_utf8_lossy(&line).to_string();
                let _ = app.emit(
                    "setup-log",
                    SetupLogEvent {
                        line,
                        stream: "stderr".to_string(),
                    },
                );
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(status) => {
                if status.code != Some(0) {
                    return Err(format!(
                        "daemon-setup init exited with code {:?}",
                        status.code
                    ));
                }
                break;
            }
            _ => {}
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn setup_alias(app: AppHandle) -> Result<(), String> {
    let shell = app.shell();

    let (mut rx, _child) = shell
        .sidecar("daemon-setup")
        .map_err(|e| format!("Failed to create sidecar: {}", e))?
        .args(["alias"])
        .spawn()
        .map_err(|e| format!("Failed to spawn daemon-setup alias: {}", e))?;

    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                let line = String::from_utf8_lossy(&line).to_string();
                let _ = app.emit(
                    "setup-log",
                    SetupLogEvent {
                        line,
                        stream: "stdout".to_string(),
                    },
                );
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                let line = String::from_utf8_lossy(&line).to_string();
                let _ = app.emit(
                    "setup-log",
                    SetupLogEvent {
                        line,
                        stream: "stderr".to_string(),
                    },
                );
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(status) => {
                if status.code != Some(0) {
                    return Err(format!(
                        "daemon-setup alias exited with code {:?}",
                        status.code
                    ));
                }
                break;
            }
            _ => {}
        }
    }

    Ok(())
}
