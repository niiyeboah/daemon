use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use sysinfo::{Disks, System};

use super::ollama::OLLAMA_BASE;

pub const OPENCLAW_BASE: &str = "http://127.0.0.1:18789";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiagnosticCheck {
    pub id: String,
    pub name: String,
    pub status: String, // "pass", "warn", "fail"
    pub message: String,
    pub metric: Option<String>,
    pub detail: Option<String>,
    pub action: Option<DiagnosticAction>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiagnosticAction {
    pub label: String,
    pub command: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosticsReport {
    pub timestamp: u64,
    pub checks: Vec<DiagnosticCheck>,
    pub overall_status: String, // "healthy", "degraded", "unhealthy"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub total_ram: u64,
    pub available_ram: u64,
    pub used_ram: u64,
    pub total_disk: u64,
    pub free_disk: u64,
    pub cpu_brand: String,
    pub cpu_count: usize,
}

// Internal types for Ollama /api/ps
#[derive(Debug, Deserialize)]
struct PsResponse {
    models: Option<Vec<PsModel>>,
}

#[derive(Debug, Deserialize)]
struct PsModel {
    name: String,
    #[allow(dead_code)]
    size: Option<u64>,
    #[allow(dead_code)]
    expires_at: Option<String>,
}

// Internal types for chat response (for inference test)
#[derive(Debug, Deserialize)]
struct TestChatResponse {
    message: Option<TestChatMessage>,
    done: Option<bool>,
    eval_count: Option<u64>,
    eval_duration: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct TestChatMessage {
    content: String,
}

fn check_binary_in_path(name: &str) -> Option<String> {
    let cmd = if cfg!(target_os = "windows") {
        std::process::Command::new("where")
            .arg(name)
            .output()
    } else {
        std::process::Command::new("which")
            .arg(name)
            .output()
    };

    match cmd {
        Ok(output) if output.status.success() => {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if path.is_empty() {
                None
            } else {
                // Take first line in case of multiple results
                Some(path.lines().next().unwrap_or(&path).to_string())
            }
        }
        _ => None,
    }
}

#[tauri::command]
pub async fn diagnostics_full() -> Result<DiagnosticsReport, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let mut checks = Vec::new();

    // 1. Ollama installed
    let ollama_path = check_binary_in_path("ollama");
    checks.push(DiagnosticCheck {
        id: "ollama-installed".to_string(),
        name: "Ollama Installed".to_string(),
        status: if ollama_path.is_some() { "pass" } else { "fail" }.to_string(),
        message: if let Some(ref p) = ollama_path {
            format!("Found at {}", p)
        } else {
            "Not found in PATH".to_string()
        },
        metric: None,
        detail: ollama_path.clone(),
        action: if ollama_path.is_none() {
            Some(DiagnosticAction {
                label: "Install Ollama".to_string(),
                command: "install-ollama".to_string(),
            })
        } else {
            None
        },
    });

    // 2. Ollama API running
    let api_reachable = match client.get(OLLAMA_BASE).send().await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    };
    checks.push(DiagnosticCheck {
        id: "ollama-api".to_string(),
        name: "Ollama API".to_string(),
        status: if api_reachable { "pass" } else { "fail" }.to_string(),
        message: if api_reachable {
            "API is running".to_string()
        } else {
            "Connection refused".to_string()
        },
        metric: None,
        detail: Some(format!("{}", OLLAMA_BASE)),
        action: if !api_reachable {
            Some(DiagnosticAction {
                label: "Start Ollama".to_string(),
                command: "start-ollama".to_string(),
            })
        } else {
            None
        },
    });

    // 3 & 4. Model availability (only if API is reachable)
    let mut has_base_model = false;
    let mut has_daemon_model = false;
    let mut models_detail = String::new();

    if api_reachable {
        if let Ok(resp) = client
            .get(format!("{}/api/tags", OLLAMA_BASE))
            .send()
            .await
        {
            if let Ok(text) = resp.text().await {
                models_detail = text.clone();
                #[derive(Deserialize)]
                struct Tags {
                    models: Option<Vec<TagModel>>,
                }
                #[derive(Deserialize)]
                struct TagModel {
                    name: String,
                }
                if let Ok(tags) = serde_json::from_str::<Tags>(&text) {
                    if let Some(models) = tags.models {
                        has_base_model = models.iter().any(|m| {
                            m.name == "qwen2.5-coder:7b"
                                || m.name.starts_with("qwen2.5-coder:7b:")
                                || m.name == "daemon"
                                || m.name.starts_with("daemon:")
                        });
                        has_daemon_model = models
                            .iter()
                            .any(|m| m.name == "daemon" || m.name.starts_with("daemon:"));
                    }
                }
            }
        }
    }

    checks.push(DiagnosticCheck {
        id: "base-model".to_string(),
        name: "Base Model".to_string(),
        status: if !api_reachable {
            "fail"
        } else if has_base_model {
            "pass"
        } else {
            "fail"
        }
        .to_string(),
        message: if !api_reachable {
            "Cannot check — API offline".to_string()
        } else if has_base_model {
            "Base model available".to_string()
        } else {
            "Base model not found".to_string()
        },
        metric: None,
        detail: if !models_detail.is_empty() {
            Some(models_detail.clone())
        } else {
            None
        },
        action: if api_reachable && !has_base_model {
            Some(DiagnosticAction {
                label: "Pull Model".to_string(),
                command: "pull-base-model".to_string(),
            })
        } else {
            None
        },
    });

    checks.push(DiagnosticCheck {
        id: "daemon-model".to_string(),
        name: "Daemon Model".to_string(),
        status: if !api_reachable {
            "fail"
        } else if has_daemon_model {
            "pass"
        } else {
            "fail"
        }
        .to_string(),
        message: if !api_reachable {
            "Cannot check — API offline".to_string()
        } else if has_daemon_model {
            "daemon model available".to_string()
        } else {
            "daemon model not found".to_string()
        },
        metric: None,
        detail: None,
        action: if api_reachable && !has_daemon_model {
            Some(DiagnosticAction {
                label: "Create Model".to_string(),
                command: "create-daemon-model".to_string(),
            })
        } else {
            None
        },
    });

    // 5. Model loaded in memory
    let mut loaded_model = None;
    if api_reachable {
        if let Ok(resp) = client
            .get(format!("{}/api/ps", OLLAMA_BASE))
            .send()
            .await
        {
            if let Ok(ps) = resp.json::<PsResponse>().await {
                if let Some(models) = &ps.models {
                    if !models.is_empty() {
                        loaded_model = Some(models[0].name.clone());
                    }
                }
            }
        }
    }

    checks.push(DiagnosticCheck {
        id: "model-loaded".to_string(),
        name: "Model Loaded".to_string(),
        status: if !api_reachable {
            "fail"
        } else if loaded_model.is_some() {
            "pass"
        } else {
            "warn"
        }
        .to_string(),
        message: if !api_reachable {
            "Cannot check — API offline".to_string()
        } else if let Some(ref m) = loaded_model {
            format!("{} loaded in memory", m)
        } else {
            "No model loaded (normal if idle)".to_string()
        },
        metric: loaded_model.clone(),
        detail: None,
        action: None,
    });

    // 6 & 7. Inference test (only if API reachable and daemon model available)
    let mut inference_ok = false;
    let mut tokens_per_second: Option<f64> = None;
    let mut inference_detail = String::new();

    if api_reachable && has_daemon_model {
        let start = Instant::now();
        let test_body = serde_json::json!({
            "model": "daemon",
            "messages": [{"role": "user", "content": "Hi"}],
            "stream": false,
        });

        match client
            .post(format!("{}/api/chat", OLLAMA_BASE))
            .json(&test_body)
            .send()
            .await
        {
            Ok(resp) => {
                let elapsed = start.elapsed();
                if let Ok(chat) = resp.json::<TestChatResponse>().await {
                    if chat.done.unwrap_or(false) {
                        inference_ok = true;
                        inference_detail = format!(
                            "Response: {}",
                            chat.message
                                .map(|m| m.content)
                                .unwrap_or_default()
                        );

                        if let (Some(count), Some(duration)) =
                            (chat.eval_count, chat.eval_duration)
                        {
                            if duration > 0 {
                                tokens_per_second =
                                    Some(count as f64 / (duration as f64 / 1_000_000_000.0));
                            }
                        }

                        inference_detail.push_str(&format!(
                            "\nLatency: {:.0}ms",
                            elapsed.as_millis()
                        ));
                    }
                }
            }
            Err(e) => {
                inference_detail = format!("Error: {}", e);
            }
        }
    }

    checks.push(DiagnosticCheck {
        id: "inference".to_string(),
        name: "Inference".to_string(),
        status: if !api_reachable || !has_daemon_model {
            "fail"
        } else if inference_ok {
            "pass"
        } else {
            "fail"
        }
        .to_string(),
        message: if !api_reachable {
            "Cannot test — API offline".to_string()
        } else if !has_daemon_model {
            "Cannot test — daemon model missing".to_string()
        } else if inference_ok {
            "Inference working".to_string()
        } else {
            "Inference failed".to_string()
        },
        metric: tokens_per_second.map(|t| format!("{:.1} tok/s", t)),
        detail: if !inference_detail.is_empty() {
            Some(inference_detail)
        } else {
            None
        },
        action: None,
    });

    checks.push(DiagnosticCheck {
        id: "inference-speed".to_string(),
        name: "Inference Speed".to_string(),
        status: if let Some(tps) = tokens_per_second {
            if tps >= 5.0 {
                "pass"
            } else {
                "warn"
            }
        } else {
            "fail"
        }
        .to_string(),
        message: if let Some(tps) = tokens_per_second {
            if tps >= 5.0 {
                format!("{:.1} tokens/sec", tps)
            } else {
                format!("{:.1} tokens/sec (slow)", tps)
            }
        } else {
            "No data".to_string()
        },
        metric: tokens_per_second.map(|t| format!("{:.1} tok/s", t)),
        detail: None,
        action: None,
    });

    // 8 & 9. System info
    let mut sys = System::new();
    sys.refresh_memory();

    let total_ram = sys.total_memory();
    let available_ram = sys.available_memory();
    let used_ram = sys.used_memory();
    let ram_warning = available_ram < 2 * 1024 * 1024 * 1024; // < 2 GB

    checks.push(DiagnosticCheck {
        id: "system-ram".to_string(),
        name: "System RAM".to_string(),
        status: if ram_warning { "warn" } else { "pass" }.to_string(),
        message: format!(
            "{:.1} GB / {:.1} GB used",
            used_ram as f64 / 1_073_741_824.0,
            total_ram as f64 / 1_073_741_824.0,
        ),
        metric: Some(format!(
            "{:.1} GB free",
            available_ram as f64 / 1_073_741_824.0
        )),
        detail: Some(format!(
            "Total: {:.1} GB, Used: {:.1} GB, Available: {:.1} GB",
            total_ram as f64 / 1_073_741_824.0,
            used_ram as f64 / 1_073_741_824.0,
            available_ram as f64 / 1_073_741_824.0,
        )),
        action: None,
    });

    let disks = Disks::new_with_refreshed_list();
    let root_disk = disks.list().iter().find(|d| {
        let mp = d.mount_point().to_string_lossy();
        mp == "/" || mp == "C:\\"
    });

    let (total_disk, free_disk) = if let Some(disk) = root_disk {
        (disk.total_space(), disk.available_space())
    } else if let Some(disk) = disks.list().first() {
        (disk.total_space(), disk.available_space())
    } else {
        (0, 0)
    };

    let disk_warning = free_disk < 5 * 1024 * 1024 * 1024; // < 5 GB

    checks.push(DiagnosticCheck {
        id: "disk-space".to_string(),
        name: "Disk Space".to_string(),
        status: if disk_warning { "warn" } else { "pass" }.to_string(),
        message: format!(
            "{:.1} GB free of {:.1} GB",
            free_disk as f64 / 1_073_741_824.0,
            total_disk as f64 / 1_073_741_824.0,
        ),
        metric: Some(format!(
            "{:.1} GB free",
            free_disk as f64 / 1_073_741_824.0
        )),
        detail: None,
        action: None,
    });

    // 10. OpenClaw installed
    let openclaw_path = check_binary_in_path("openclaw");
    checks.push(DiagnosticCheck {
        id: "openclaw-installed".to_string(),
        name: "OpenClaw Installed".to_string(),
        status: if openclaw_path.is_some() {
            "pass"
        } else {
            "warn"
        }
        .to_string(),
        message: if let Some(ref p) = openclaw_path {
            format!("Found at {}", p)
        } else {
            "Not found in PATH".to_string()
        },
        metric: None,
        detail: openclaw_path,
        action: None,
    });

    // 11. OpenClaw gateway
    let openclaw_gateway = if let Ok(resp) = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .unwrap_or_default()
        .get(OPENCLAW_BASE)
        .send()
        .await
    {
        resp.status().is_success() || resp.status().as_u16() < 500
    } else {
        false
    };

    checks.push(DiagnosticCheck {
        id: "openclaw-gateway".to_string(),
        name: "OpenClaw Gateway".to_string(),
        status: if openclaw_gateway {
            "pass"
        } else {
            "warn"
        }
        .to_string(),
        message: if openclaw_gateway {
            "Gateway running".to_string()
        } else {
            "Gateway not running".to_string()
        },
        metric: None,
        detail: Some(format!("{}", OPENCLAW_BASE)),
        action: None,
    });

    // Calculate overall status
    let fail_count = checks.iter().filter(|c| c.status == "fail").count();
    let warn_count = checks.iter().filter(|c| c.status == "warn").count();

    let overall_status = if fail_count > 0 {
        "unhealthy"
    } else if warn_count > 0 {
        "degraded"
    } else {
        "healthy"
    }
    .to_string();

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    Ok(DiagnosticsReport {
        timestamp,
        checks,
        overall_status,
    })
}

#[tauri::command]
pub async fn system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new();
    sys.refresh_memory();
    sys.refresh_cpu_all();

    let cpus = sys.cpus();
    let cpu_brand = cpus
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let disks = Disks::new_with_refreshed_list();
    let (total_disk, free_disk) = disks
        .list()
        .iter()
        .find(|d| {
            let mp = d.mount_point().to_string_lossy();
            mp == "/" || mp == "C:\\"
        })
        .or_else(|| disks.list().first())
        .map(|d| (d.total_space(), d.available_space()))
        .unwrap_or((0, 0));

    Ok(SystemInfo {
        total_ram: sys.total_memory(),
        available_ram: sys.available_memory(),
        used_ram: sys.used_memory(),
        total_disk,
        free_disk,
        cpu_brand,
        cpu_count: cpus.len(),
    })
}
