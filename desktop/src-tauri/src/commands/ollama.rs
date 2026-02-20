use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

pub const OLLAMA_BASE: &str = "http://localhost:11434";

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub installed: bool,
    pub api_reachable: bool,
    pub version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message: Message,
    pub done: bool,
    pub total_duration: Option<u64>,
    pub eval_count: Option<u64>,
    pub eval_duration: Option<u64>,
    pub tokens_per_second: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatTokenEvent {
    pub content: String,
    pub done: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PullProgressEvent {
    pub status: String,
    pub completed: Option<u64>,
    pub total: Option<u64>,
}

// Internal API response types

#[derive(Debug, Deserialize)]
struct TagsResponse {
    models: Option<Vec<TagModel>>,
}

#[derive(Debug, Deserialize)]
struct TagModel {
    name: String,
    size: u64,
    modified_at: String,
}

#[derive(Debug, Deserialize)]
struct ChatStreamChunk {
    message: Option<ChunkMessage>,
    done: bool,
    total_duration: Option<u64>,
    eval_count: Option<u64>,
    eval_duration: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct ChunkMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct PullChunk {
    status: String,
    completed: Option<u64>,
    total: Option<u64>,
}

// Running models types (/api/ps)
#[derive(Debug, Serialize, Deserialize)]
pub struct RunningModel {
    pub name: String,
    pub size: Option<u64>,
    pub expires_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PsResponse {
    models: Option<Vec<PsModel>>,
}

#[derive(Debug, Deserialize)]
struct PsModel {
    name: String,
    size: Option<u64>,
    expires_at: Option<String>,
}

#[tauri::command]
pub async fn ollama_check() -> Result<OllamaStatus, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    // Check if API is reachable
    let version = match client.get(OLLAMA_BASE).send().await {
        Ok(resp) => {
            if resp.status().is_success() {
                let text = resp.text().await.unwrap_or_default();
                // Ollama returns "Ollama is running" at root
                if text.contains("Ollama") {
                    Some(text.trim().to_string())
                } else {
                    Some("unknown".to_string())
                }
            } else {
                None
            }
        }
        Err(_) => None,
    };

    let api_reachable = version.is_some();

    Ok(OllamaStatus {
        installed: api_reachable, // If API responds, it's installed and running
        api_reachable,
        version,
    })
}

#[tauri::command]
pub async fn ollama_list_models() -> Result<Vec<ModelInfo>, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(format!("{}/api/tags", OLLAMA_BASE))
        .send()
        .await
        .map_err(|e| format!("Failed to reach Ollama API: {}", e))?;

    let tags: TagsResponse = resp.json().await.map_err(|e| e.to_string())?;

    let models = tags
        .models
        .unwrap_or_default()
        .into_iter()
        .map(|m| ModelInfo {
            name: m.name,
            size: m.size,
            modified_at: m.modified_at,
        })
        .collect();

    Ok(models)
}

#[tauri::command]
pub async fn ollama_pull_model(app: AppHandle, model: String) -> Result<(), String> {
    let client = Client::new();

    let resp = client
        .post(format!("{}/api/pull", OLLAMA_BASE))
        .json(&serde_json::json!({ "name": model, "stream": true }))
        .send()
        .await
        .map_err(|e| format!("Failed to start pull: {}", e))?;

    let mut stream = resp.bytes_stream();
    let mut buffer = Vec::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.extend_from_slice(&chunk);

        // Process complete lines
        while let Some(pos) = buffer.iter().position(|&b| b == b'\n') {
            let line: Vec<u8> = buffer.drain(..=pos).collect();
            let line = String::from_utf8_lossy(&line);
            let line = line.trim();

            if line.is_empty() {
                continue;
            }

            if let Ok(pull_chunk) = serde_json::from_str::<PullChunk>(line) {
                let _ = app.emit(
                    "pull-progress",
                    PullProgressEvent {
                        status: pull_chunk.status,
                        completed: pull_chunk.completed,
                        total: pull_chunk.total,
                    },
                );
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn ollama_chat(
    app: AppHandle,
    model: String,
    messages: Vec<Message>,
    stream: bool,
) -> Result<ChatResponse, String> {
    let client = Client::new();

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": stream,
    });

    let resp = client
        .post(format!("{}/api/chat", OLLAMA_BASE))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to send chat request: {}", e))?;

    if !stream {
        let chat_resp: ChatResponse = resp.json().await.map_err(|e| e.to_string())?;
        return Ok(chat_resp);
    }

    // Streaming mode
    let mut full_content = String::new();
    let mut final_response = ChatResponse {
        message: Message {
            role: "assistant".to_string(),
            content: String::new(),
        },
        done: false,
        total_duration: None,
        eval_count: None,
        eval_duration: None,
        tokens_per_second: None,
    };

    let mut byte_stream = resp.bytes_stream();
    let mut buffer = Vec::new();

    while let Some(chunk) = byte_stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.extend_from_slice(&chunk);

        while let Some(pos) = buffer.iter().position(|&b| b == b'\n') {
            let line: Vec<u8> = buffer.drain(..=pos).collect();
            let line = String::from_utf8_lossy(&line);
            let line = line.trim();

            if line.is_empty() {
                continue;
            }

            if let Ok(chunk) = serde_json::from_str::<ChatStreamChunk>(line) {
                if let Some(msg) = &chunk.message {
                    full_content.push_str(&msg.content);
                    let _ = app.emit(
                        "chat-token",
                        ChatTokenEvent {
                            content: msg.content.clone(),
                            done: chunk.done,
                        },
                    );
                }

                if chunk.done {
                    final_response.done = true;
                    final_response.total_duration = chunk.total_duration;
                    final_response.eval_count = chunk.eval_count;
                    final_response.eval_duration = chunk.eval_duration;

                    if let (Some(count), Some(duration)) =
                        (chunk.eval_count, chunk.eval_duration)
                    {
                        if duration > 0 {
                            final_response.tokens_per_second =
                                Some(count as f64 / (duration as f64 / 1_000_000_000.0));
                        }
                    }
                }
            }
        }
    }

    final_response.message.content = full_content;
    Ok(final_response)
}

#[tauri::command]
pub async fn ollama_running_models() -> Result<Vec<RunningModel>, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(format!("{}/api/ps", OLLAMA_BASE))
        .send()
        .await
        .map_err(|e| format!("Failed to reach Ollama API: {}", e))?;

    let ps: PsResponse = resp.json().await.map_err(|e| e.to_string())?;

    let models = ps
        .models
        .unwrap_or_default()
        .into_iter()
        .map(|m| RunningModel {
            name: m.name,
            size: m.size,
            expires_at: m.expires_at,
        })
        .collect();

    Ok(models)
}
