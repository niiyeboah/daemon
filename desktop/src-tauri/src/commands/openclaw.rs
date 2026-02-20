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
/// For local mode, removes gateway.auth to avoid "device token mismatch" errors that
/// doctor --fix can introduce (see openclaw/openclaw#18225).
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

    // For local loopback gateways, gateway.auth causes "device token mismatch" errors
    // when doctor --fix adds it. Remove auth so the gateway accepts local connections.
    gateway.remove("auth");

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

/// Removes gateway.auth from config for local mode. doctor --fix adds it and causes
/// "device token mismatch" for loopback gateways (openclaw/openclaw#18225).
fn remove_gateway_auth_for_local() -> Result<(), String> {
    let config_path = openclaw_config_path();
    if !config_path.exists() {
        return Ok(());
    }
    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    let mut config: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Invalid config: {}", e))?;
    let gateway = config
        .get_mut("gateway")
        .and_then(|g| g.as_object_mut());
    if let Some(gw) = gateway {
        gw.remove("auth");
    }
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

/// On macOS, removes OPENCLAW_GATEWAY_TOKEN from the LaunchAgent plist. The token
/// causes "device token mismatch" when it doesn't match the config (which we clear).
#[cfg(target_os = "macos")]
fn remove_gateway_token_from_launchd() -> Result<(), String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let plist_path = home
        .join("Library")
        .join("LaunchAgents")
        .join("ai.openclaw.gateway.plist");
    if !plist_path.exists() {
        return Ok(());
    }
    let status = std::process::Command::new("/usr/libexec/PlistBuddy")
        .args([
            "-c",
            "Delete :EnvironmentVariables:OPENCLAW_GATEWAY_TOKEN",
            plist_path.to_str().unwrap(),
        ])
        .status()
        .map_err(|e| format!("Failed to run PlistBuddy: {}", e))?;
    // Exit code 0 = success, 1 = key didn't exist (also fine)
    if !status.success() && status.code() != Some(1) {
        return Err(format!(
            "PlistBuddy failed with code {:?}",
            status.code()
        ));
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn remove_gateway_token_from_launchd() -> Result<(), String> {
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

/// Check if the gateway is reachable (required for channels login to work).
async fn gateway_reachable() -> bool {
    if let Ok(client) = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
    {
        if let Ok(resp) = client.get(OPENCLAW_BASE).send().await {
            return resp.status().is_success() || resp.status().as_u16() < 500;
        }
    }
    false
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

    // doctor --fix can add gateway.auth which causes "device token mismatch" for local
    // loopback gateways (openclaw/openclaw#18225). Remove it so the gateway accepts connections.
    remove_gateway_auth_for_local()?;

    // On macOS, the LaunchAgent plist has OPENCLAW_GATEWAY_TOKEN baked in; remove it too.
    remove_gateway_token_from_launchd()?;

    // Stop any running gateway (may be using old token), then start fresh with no auth.
    let _ = spawn_and_stream(&app, "openclaw", &["gateway", "stop"]).await;
    let _ = spawn_and_stream(&app, "openclaw", &["gateway", "start"]).await;
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // WhatsApp is a plugin that is disabled by default; enable it before login
    let _ = spawn_and_stream(&app, "openclaw", &["plugins", "enable", "whatsapp"]).await;

    // Gateway must be reachable for channels login to display the QR and complete pairing.
    // If it times out, channels login will fail and the QR may never appear.
    if !gateway_reachable().await {
        return Err(
            "OpenClaw gateway is not reachable. The gateway must be running for WhatsApp login. \
            Try: openclaw gateway stop (to clear any stuck process), then openclaw gateway start. \
            Or open http://127.0.0.1:18789/ in a browser to use the Control UI.".to_string(),
        );
    }

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
                    let is_squareish = rows >= 10 && cols >= 10
                        && (rows as f64 / cols as f64) >= 0.3
                        && (rows as f64 / cols as f64) <= 3.0;
                    if is_squareish {
                        let qr_data = qr_lines.join("\n");
                        let payload = OpenClawQrEvent { data: qr_data.clone() };
                        let _ = app_qr.emit("openclaw-qr", &payload);
                        // Also emit to main window in case global emit doesn't reach the webview
                        let _ = app_qr.emit_to("main", "openclaw-qr", &payload);
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
                let is_squareish = rows >= 10 && cols >= 10
                    && (rows as f64 / cols as f64) >= 0.3
                    && (rows as f64 / cols as f64) <= 3.0;
                if is_squareish {
                    let qr_data = qr_lines.join("\n");
                    let payload = OpenClawQrEvent { data: qr_data.clone() };
                    let _ = app_qr.emit("openclaw-qr", &payload);
                    let _ = app_qr.emit_to("main", "openclaw-qr", &payload);
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

    // After successful WhatsApp login, discover the linked number and configure
    // channels.whatsapp.allowFrom + dmPolicy so self-chat safeguards activate.
    // Without this, the bot replies to its own messages creating an infinite loop.
    configure_whatsapp_self_chat().await.ok();

    Ok(())
}

/// Discovers the linked WhatsApp number and writes channels.whatsapp config
/// to enable self-chat safeguards (loop prevention). Without allowFrom set,
/// OpenClaw doesn't know which messages are from "self" and will reply to
/// its own error messages, creating an infinite feedback loop.
async fn configure_whatsapp_self_chat() -> Result<(), String> {
    // Get the linked phone number
    let output = tokio::process::Command::new("openclaw")
        .args(["directory", "self", "--channel", "whatsapp", "--json"])
        .output()
        .await
        .map_err(|e| format!("Failed to run directory self: {}", e))?;

    if !output.status.success() {
        return Err("Failed to get self number".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    // Parse JSON output to get the phone number
    let parsed: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Failed to parse directory self output: {}", e))?;

    // The output may be an array of entries or an object with an id field
    let phone = parsed
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|entry| entry.get("id").or(entry.get("phone")))
        .or_else(|| parsed.get("id").or(parsed.get("phone")))
        .and_then(|v| v.as_str())
        .ok_or("Could not find phone number in directory self output")?
        .to_string();

    if phone.is_empty() {
        return Err("Self phone number is empty".to_string());
    }

    // Write channels.whatsapp config to openclaw.json
    let config_path = openclaw_config_path();
    let mut config: serde_json::Value = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    let obj = config.as_object_mut().ok_or("Config is not a JSON object")?;
    let channels = obj
        .entry("channels")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("channels must be an object")?;
    let whatsapp = channels
        .entry("whatsapp")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("channels.whatsapp must be an object")?;

    // allowlist + own number activates self-chat safeguards in OpenClaw:
    // - skips read receipts for self-chat
    // - ignores mention-JID auto-triggers
    // - prevents the bot from replying to its own messages
    whatsapp.insert("dmPolicy".to_string(), serde_json::json!("allowlist"));
    whatsapp.insert("allowFrom".to_string(), serde_json::json!([phone]));

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

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

    // Register Ollama as a provider with explicit model definition so OpenClaw
    // doesn't fall back to Anthropic. Uses openai-completions API which Ollama supports.
    let model_ref = format!("ollama/{}", model);
    let models_section = obj
        .entry("models")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("models must be an object")?;
    models_section.insert("mode".to_string(), serde_json::json!("merge"));
    let providers = models_section
        .entry("providers")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .ok_or("models.providers must be an object")?;
    providers.insert(
        "ollama".to_string(),
        serde_json::json!({
            "baseUrl": "http://127.0.0.1:11434/v1",
            "apiKey": "ollama",
            "api": "openai-completions",
            "models": [{
                "id": model,
                "name": "Daemon",
                "reasoning": false,
                "input": ["text"],
                "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
                "contextWindow": 16384,
                "maxTokens": 8192
            }]
        }),
    );

    // Set Ollama model as the default under agents.defaults
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

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    // Write auth-profiles.json for the Ollama provider so OpenClaw doesn't
    // error with "No API key found for provider". Ollama doesn't validate keys.
    let agent_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("~"))
        .join(".openclaw")
        .join("agents")
        .join("main")
        .join("agent");
    std::fs::create_dir_all(&agent_dir)
        .map_err(|e| format!("Failed to create agent dir: {}", e))?;
    let auth_path = agent_dir.join("auth-profiles.json");

    // Read existing auth profiles or start fresh
    let mut auth: serde_json::Value = if auth_path.exists() {
        let content = std::fs::read_to_string(&auth_path)
            .map_err(|e| format!("Failed to read auth profiles: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };
    let auth_obj = auth.as_object_mut().ok_or("Auth profiles must be a JSON object")?;
    auth_obj.insert(
        "ollama:local".to_string(),
        serde_json::json!({
            "provider": "ollama",
            "mode": "api_key",
            "key": "ollama"
        }),
    );
    let auth_content = serde_json::to_string_pretty(&auth)
        .map_err(|e| format!("Failed to serialize auth profiles: {}", e))?;
    std::fs::write(&auth_path, auth_content)
        .map_err(|e| format!("Failed to write auth profiles: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn openclaw_gateway_restart(app: AppHandle) -> Result<(), String> {
    spawn_and_stream(&app, "openclaw", &["gateway", "restart"]).await
}
