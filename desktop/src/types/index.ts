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

// Diagnostics types

export interface DiagnosticAction {
  label: string;
  command: string;
}

export interface DiagnosticCheck {
  id: string;
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  metric?: string | null;
  detail?: string | null;
  action?: DiagnosticAction | null;
}

export interface DiagnosticsReport {
  timestamp: number;
  checks: DiagnosticCheck[];
  overall_status: "healthy" | "degraded" | "unhealthy";
}

export interface SystemInfo {
  total_ram: number;
  available_ram: number;
  used_ram: number;
  total_disk: number;
  free_disk: number;
  cpu_brand: string;
  cpu_count: number;
}

export interface RunningModel {
  name: string;
  size: number | null;
  expires_at: string | null;
}

// OpenClaw types

export interface OpenClawStatus {
  installed: boolean;
  path: string | null;
  gateway_running: boolean;
}

export interface OpenClawLogEvent {
  line: string;
  stream: "stdout" | "stderr";
}

export interface OpenClawQrEvent {
  data: string;
}

export interface ApiKeyStatus {
  configured: boolean;
  masked: string | null;
}

export interface ApiKeysStatus {
  gemini: ApiKeyStatus;
  openai: ApiKeyStatus;
  anthropic: ApiKeyStatus;
}

// Settings types

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  theme: Theme;
  defaultModel: string;
  systemPrompt: string;
}
