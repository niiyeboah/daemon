use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use sysinfo::{Disks, System};

pub const OPENCLAW_BASE: &str = "http://127.0.0.1:18789";

const OPENROUTER_MODELS_URL: &str = "https://openrouter.ai/api/v1/models";

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

pub fn check_binary_in_path(name: &str) -> Option<String> {
    // On macOS, GUI apps inherit a minimal PATH that often excludes
    // directories added by the user's shell profile (Homebrew, nvm, cargo,
    // openclaw, etc.). Resolve the full login-shell PATH so `which` can
    // find binaries the same way a terminal would.
    let extended_path = if cfg!(target_os = "macos") {
        resolve_login_shell_path()
    } else {
        None
    };

    let cmd = if cfg!(target_os = "windows") {
        std::process::Command::new("where")
            .arg(name)
            .output()
    } else {
        let mut c = std::process::Command::new("which");
        c.arg(name);
        if let Some(ref p) = extended_path {
            c.env("PATH", p);
        }
        c.output()
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

/// Resolve the full PATH from the user's default login shell.
///
/// macOS GUI apps get a minimal PATH (/usr/bin:/bin:/usr/sbin:/sbin).
/// By spawning a login shell (`$SHELL -lc 'echo $PATH'`) we pick up
/// everything the user has configured in .zshrc, .bash_profile, etc.
/// (nvm, Homebrew, cargo, ~/.openclaw/bin, and so on).
///
/// Falls back to appending well-known directories if the shell approach fails.
pub fn resolve_login_shell_path() -> Option<String> {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let current = std::env::var("PATH").unwrap_or_default();

    if let Ok(output) = std::process::Command::new(&shell)
        .args(["-lc", "echo $PATH"])
        .output()
    {
        if output.status.success() {
            let shell_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !shell_path.is_empty() {
                let mut parts: Vec<&str> = shell_path.split(':').collect();
                for entry in current.split(':') {
                    if !entry.is_empty() && !parts.contains(&entry) {
                        parts.push(entry);
                    }
                }
                return Some(parts.join(":"));
            }
        }
    }

    let extras = [
        "/usr/local/bin",
        "/opt/homebrew/bin",
        "/opt/homebrew/sbin",
    ];
    let mut parts: Vec<&str> = current.split(':').collect();
    for extra in &extras {
        if !parts.contains(extra) {
            parts.push(extra);
        }
    }
    Some(parts.join(":"))
}

#[tauri::command]
pub async fn diagnostics_full(api_key: String) -> Result<DiagnosticsReport, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let mut checks = Vec::new();

    // 1. OpenRouter API key configured
    let key_set = !api_key.trim().is_empty();
    checks.push(DiagnosticCheck {
        id: "openrouter-key".to_string(),
        name: "OpenRouter API Key".to_string(),
        status: if key_set { "pass" } else { "fail" }.to_string(),
        message: if key_set {
            "API key is configured".to_string()
        } else {
            "No API key — go to Settings to add one".to_string()
        },
        metric: None,
        detail: None,
        action: None,
    });

    // 2. OpenRouter API reachable (also validates the key)
    let mut openrouter_ok = false;
    let mut openrouter_latency_ms: Option<u128> = None;
    let mut openrouter_detail: Option<String> = None;

    if key_set {
        let start = Instant::now();
        match client
            .get(OPENROUTER_MODELS_URL)
            .header("Authorization", format!("Bearer {}", api_key.trim()))
            .header("HTTP-Referer", "http://localhost")
            .send()
            .await
        {
            Ok(resp) => {
                let latency = start.elapsed().as_millis();
                openrouter_latency_ms = Some(latency);
                if resp.status().is_success() {
                    openrouter_ok = true;
                } else {
                    let status = resp.status();
                    let body = resp.text().await.unwrap_or_default();
                    openrouter_detail = Some(format!("HTTP {}: {}", status, &body[..body.len().min(200)]));
                }
            }
            Err(e) => {
                openrouter_detail = Some(format!("Connection error: {}", e));
            }
        }
    }

    checks.push(DiagnosticCheck {
        id: "openrouter-api".to_string(),
        name: "OpenRouter API".to_string(),
        status: if !key_set {
            "fail"
        } else if openrouter_ok {
            "pass"
        } else {
            "fail"
        }
        .to_string(),
        message: if !key_set {
            "Cannot check — no API key".to_string()
        } else if openrouter_ok {
            format!(
                "Connected ({}ms)",
                openrouter_latency_ms.unwrap_or(0)
            )
        } else {
            "API unreachable or key invalid".to_string()
        },
        metric: openrouter_latency_ms.map(|ms| format!("{}ms", ms)),
        detail: openrouter_detail,
        action: None,
    });

    // 3. OpenClaw installed
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
            "Not found — run Setup to install".to_string()
        },
        metric: None,
        detail: openclaw_path,
        action: None,
    });

    // 4. OpenClaw gateway running
    let openclaw_gateway = if let Ok(c) = Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
    {
        match c.get(OPENCLAW_BASE).send().await {
            Ok(resp) => resp.status().is_success() || resp.status().as_u16() < 500,
            Err(_) => false,
        }
    } else {
        false
    };

    checks.push(DiagnosticCheck {
        id: "openclaw-gateway".to_string(),
        name: "OpenClaw Gateway".to_string(),
        status: if openclaw_gateway { "pass" } else { "warn" }.to_string(),
        message: if openclaw_gateway {
            "Gateway running".to_string()
        } else {
            "Gateway not running".to_string()
        },
        metric: None,
        detail: Some(OPENCLAW_BASE.to_string()),
        action: if !openclaw_gateway {
            Some(DiagnosticAction {
                label: "Start Gateway".to_string(),
                command: "start-openclaw-gateway".to_string(),
            })
        } else {
            None
        },
    });

    // 5. System RAM
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

    // 6. Disk space
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

    // Overall status
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
