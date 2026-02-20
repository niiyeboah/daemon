export interface OllamaStatus {
  installed: boolean;
  api_reachable: boolean;
  version: string | null;
}

export interface ModelInfo {
  name: string;
  size: number;
  modified_at: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  message: Message;
  done: boolean;
  total_duration: number | null;
  eval_count: number | null;
  eval_duration: number | null;
  tokens_per_second: number | null;
}

export interface ChatTokenEvent {
  content: string;
  done: boolean;
}

export interface PullProgressEvent {
  status: string;
  completed: number | null;
  total: number | null;
}

export interface SetupStatus {
  ollama_found: boolean;
  ollama_path: string | null;
  output: string;
}

export interface SetupLogEvent {
  line: string;
  stream: "stdout" | "stderr";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model: string;
  stats?: {
    tokensGenerated: number;
    durationMs: number;
    tokensPerSecond: number;
  };
}

export type StepStatus = "pending" | "running" | "done" | "error";
