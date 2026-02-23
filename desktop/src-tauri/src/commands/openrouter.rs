use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

pub const OPENROUTER_BASE: &str = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL: &str = "https://openrouter.ai/api/v1/models";

#[tauri::command]
pub async fn openrouter_test_key(api_key: String) -> Result<(), String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(OPENROUTER_MODELS_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("HTTP-Referer", "http://localhost")
        .send()
        .await
        .map_err(|e| format!("Failed to reach OpenRouter: {}", e))?;

    if resp.status().is_success() {
        Ok(())
    } else {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        Err(format!("HTTP {}: {}", status, body))
    }
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

#[derive(Debug, Deserialize)]
struct OpenRouterResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: Option<MessageData>,
    delta: Option<MessageData>,
}

#[derive(Debug, Deserialize)]
struct MessageData {
    content: Option<String>,
}

#[tauri::command]
pub async fn openrouter_chat(
    app: AppHandle,
    model: String,
    messages: Vec<Message>,
    api_key: String,
    stream: bool,
) -> Result<ChatResponse, String> {
    let client = Client::new();

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": stream,
    });

    let resp = client
        .post(OPENROUTER_BASE)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("HTTP-Referer", "http://localhost") // Required by OpenRouter
        .header("X-Title", "Daemon") // Optional but good practice
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to send chat request: {}", e))?;

    if !resp.status().is_success() {
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("API request failed: {}", err_text));
    }

    if !stream {
        let chat_resp: OpenRouterResponse = resp.json().await.map_err(|e| e.to_string())?;
        
        // Extract the content from the first choice
        let content = chat_resp
            .choices
            .first()
            .and_then(|c| c.message.as_ref())
            .and_then(|m| m.content.clone())
            .unwrap_or_default();

        return Ok(ChatResponse {
            message: Message {
                role: "assistant".to_string(),
                content,
            },
            done: true,
            total_duration: None,
            eval_count: None,
            eval_duration: None,
            tokens_per_second: None,
        });
    }

    // Streaming mode handling (SSE)
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

            if line.starts_with("data: ") {
                let data = &line[6..];
                
                if data == "[DONE]" {
                    final_response.done = true;
                    // Send final event to indicate completion
                    let _ = app.emit(
                        "chat-token",
                        ChatTokenEvent {
                            content: String::new(),
                            done: true,
                        },
                    );
                    break;
                }

                if let Ok(chunk) = serde_json::from_str::<OpenRouterResponse>(data) {
                    if let Some(choice) = chunk.choices.first() {
                        if let Some(delta) = &choice.delta {
                            if let Some(content_chunk) = &delta.content {
                                full_content.push_str(content_chunk);
                                let _ = app.emit(
                                    "chat-token",
                                    ChatTokenEvent {
                                        content: content_chunk.clone(),
                                        done: false,
                                    },
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    final_response.message.content = full_content;
    Ok(final_response)
}
