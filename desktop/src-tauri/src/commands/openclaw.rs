use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

use super::diagnostics::OPENCLAW_BASE;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenClawStatus {
    pub installed: bool,
    pub path: Option<String>,
    pub gateway_running: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenClawLogEvent {
    pub line: String,
    pub stream: String, // "stdout" or "stderr"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenClawQrEvent {
    pub data: String,
}

fn find_openclaw() -> Option<String> {
    let cmd = if cfg!(target_os = "windows") {
        std::process::Command::new("where")
            .arg("openclaw")
            .output()
    } else {
        std::process::Command::new("which")
            .arg("openclaw")
            .output()
    };

    match cmd {
        Ok(output) if output.status.success() => {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if path.is_empty() {
                None
            } else {
                Some(path.lines().next().unwrap_or(&path).to_string())
            }
        }
        _ => None,
    }
}

fn openclaw_config_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("~"))
        .join(".openclaw")
        .join("openclaw.json")
}

/// Ensures gateway.mode=local in ~/.openclaw/openclaw.json so the gateway can start
/// (OpenClaw blocks startup unless this is set or --allow-unconfigured is passed).
fn ensure_gateway_mode() -> Result<(), String> {
    let config_path = openclaw_config_path();

    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let mut config: serde_json::Value = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    let obj = config
        .as_object_mut()
        .ok_or("Config is not a JSON object")?;

    let gateway = obj
        .entry("gateway")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("gateway must be an object")?;

    gateway.insert("mode".to_string(), serde_json::json!("local"));

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

/// Helper: spawn a shell command and stream stdout/stderr as openclaw-log events.
/// Returns an error string if the process exits with a non-zero code.
async fn spawn_and_stream(
    app: &AppHandle,
    program: &str,
    args: &[&str],
) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, BufReader};
    use tokio::process::Command;

    let mut child = Command::new(program)
        .args(args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn {} {:?}: {}", program, args, e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let app_out = app.clone();
    let app_err = app.clone();

    let stdout_handle = tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_out.emit(
                    "openclaw-log",
                    OpenClawLogEvent {
                        line,
                        stream: "stdout".to_string(),
                    },
                );
            }
        }
    });

    let stderr_handle = tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_err.emit(
                    "openclaw-log",
                    OpenClawLogEvent {
                        line,
                        stream: "stderr".to_string(),
                    },
                );
            }
        }
    });

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for process: {}", e))?;

    let _ = stdout_handle.await;
    let _ = stderr_handle.await;

    if !status.success() {
        return Err(format!(
            "{} exited with code {:?}",
            program,
            status.code()
        ));
    }

    Ok(())
}

#[tauri::command]
pub async fn openclaw_check() -> Result<OpenClawStatus, String> {
    let path = find_openclaw();
    let installed = path.is_some();

    let gateway_running = if let Ok(client) = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
    {
        match client.get(OPENCLAW_BASE).send().await {
            Ok(resp) => resp.status().is_success() || resp.status().as_u16() < 500,
            Err(_) => false,
        }
    } else {
        false
    };

    Ok(OpenClawStatus {
        installed,
        path,
        gateway_running,
    })
}

#[tauri::command]
pub async fn openclaw_install(app: AppHandle) -> Result<(), String> {
    spawn_and_stream(
        &app,
        "sh",
        &["-c", "curl -fsSL https://openclaw.ai/install.sh | bash"],
    )
    .await
}

#[tauri::command]
pub async fn openclaw_onboard(app: AppHandle) -> Result<(), String> {
    // Ensure gateway.mode=local before onboarding so the LaunchAgent can start
    ensure_gateway_mode()?;
    spawn_and_stream(&app, "openclaw", &["onboard", "--install-daemon"]).await
}

#[tauri::command]
pub async fn openclaw_connect_whatsapp(app: AppHandle) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, BufReader};
    use tokio::process::Command;

    // Ensure gateway.mode=local so the gateway can start
    ensure_gateway_mode()?;

    // Fix invalid config (e.g. legacy root-level provider/model/contextWindow/maxTokens)
    // before attempting login; doctor --fix removes unrecognized keys
    let _ = spawn_and_stream(&app, "openclaw", &["doctor", "--fix", "--yes"]).await;

    // WhatsApp is a plugin that is disabled by default; enable it before login
    let _ = spawn_and_stream(&app, "openclaw", &["plugins", "enable", "whatsapp"]).await;

    let mut child = Command::new("openclaw")
        .args(["channels", "login", "--channel", "whatsapp"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn openclaw channels login: {}", e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let app_out = app.clone();
    let app_err = app.clone();
    let app_qr = app.clone();

    let stdout_handle = tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let mut reader = BufReader::new(stdout).lines();
            let mut qr_lines: Vec<String> = Vec::new();
            let mut in_qr = false;

            while let Ok(Some(line)) = reader.next_line().await {
                // Detect QR code blocks (lines with block characters)
                let is_qr_line = line.contains('\u{2588}')  // █ Full block
                    || line.contains('\u{2584}')             // ▄ Lower half block
                    || line.contains('\u{2580}')             // ▀ Upper half block
                    || line.contains('\u{2591}')             // ░ Light shade
                    || line.contains('\u{2592}')             // ▒ Medium shade
                    || line.contains('\u{2593}');            // ▓ Dark shade

                if is_qr_line {
                    if !in_qr {
                        in_qr = true;
                        qr_lines.clear();
                    }
                    qr_lines.push(line.clone());
                } else if in_qr {
                    // QR block ended — emit only if it looks like a real QR (square-ish, min size)
                    in_qr = false;
                    let rows = qr_lines.len();
                    let cols = qr_lines.iter().map(|l| l.len()).max().unwrap_or(0);
                    let is_squareish = rows >= 15 && cols >= 15
                        && (rows as f64 / cols as f64) >= 0.4
                        && (rows as f64 / cols as f64) <= 2.5;
                    if is_squareish {
                        let qr_data = qr_lines.join("\n");
                        let _ = app_qr.emit(
                            "openclaw-qr",
                            OpenClawQrEvent { data: qr_data },
                        );
                    }
                    qr_lines.clear();
                }

                let _ = app_out.emit(
                    "openclaw-log",
                    OpenClawLogEvent {
                        line,
                        stream: "stdout".to_string(),
                    },
                );
            }

            // Emit any trailing QR data (with same filtering)
            if !qr_lines.is_empty() {
                let rows = qr_lines.len();
                let cols = qr_lines.iter().map(|l| l.len()).max().unwrap_or(0);
                let is_squareish = rows >= 15 && cols >= 15
                    && (rows as f64 / cols as f64) >= 0.4
                    && (rows as f64 / cols as f64) <= 2.5;
                if is_squareish {
                    let qr_data = qr_lines.join("\n");
                    let _ = app_qr.emit(
                        "openclaw-qr",
                        OpenClawQrEvent { data: qr_data },
                    );
                }
            }
        }
    });

    let stderr_handle = tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_err.emit(
                    "openclaw-log",
                    OpenClawLogEvent {
                        line,
                        stream: "stderr".to_string(),
                    },
                );
            }
        }
    });

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for process: {}", e))?;

    let _ = stdout_handle.await;
    let _ = stderr_handle.await;

    if !status.success() {
        return Err(format!(
            "openclaw channels login exited with code {:?}",
            status.code()
        ));
    }

    Ok(())
}

#[tauri::command]
pub async fn openclaw_configure_model(model: String) -> Result<(), String> {
    let config_path = openclaw_config_path();

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    // Read existing config or start with empty object
    let mut config: serde_json::Value = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    let obj = config.as_object_mut().ok_or("Config is not a JSON object")?;

    // Ensure gateway.mode=local so the gateway can start (required by OpenClaw)
    let gateway = obj
        .entry("gateway")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("gateway must be an object")?;
    gateway.insert("mode".to_string(), serde_json::json!("local"));

    // Remove legacy root-level keys that OpenClaw no longer accepts
    obj.remove("provider");
    obj.remove("model");
    obj.remove("contextWindow");
    obj.remove("maxTokens");

    // OpenClaw expects model config under agents.defaults (see docs.openclaw.ai/gateway/configuration)
    let model_ref = format!("ollama/{}", model);
    let agents = obj
        .entry("agents")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("agents must be an object")?;
    let defaults = agents
        .entry("defaults")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("agents.defaults must be an object")?;

    defaults.insert(
        "model".to_string(),
        serde_json::json!({ "primary": model_ref }),
    );
    let mut models_obj = serde_json::Map::new();
    models_obj.insert(model_ref.clone(), serde_json::json!({ "alias": "Daemon" }));
    defaults.insert("models".to_string(), serde_json::Value::Object(models_obj));

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn openclaw_gateway_restart(app: AppHandle) -> Result<(), String> {
    spawn_and_stream(&app, "openclaw", &["gateway", "restart"]).await
}
