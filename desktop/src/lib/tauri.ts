import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  OllamaStatus,
  ModelInfo,
  Message,
  ChatResponse,
  ChatTokenEvent,
  PullProgressEvent,
  SetupStatus,
  SetupLogEvent,
  DiagnosticsReport,
  SystemInfo,
  RunningModel,
} from "@/types";

// Ollama commands

export async function ollamaCheck(): Promise<OllamaStatus> {
  return invoke("ollama_check");
}

export async function ollamaListModels(): Promise<ModelInfo[]> {
  return invoke("ollama_list_models");
}

export async function ollamaPullModel(model: string): Promise<void> {
  return invoke("ollama_pull_model", { model });
}

export async function ollamaChat(
  model: string,
  messages: Message[],
  stream: boolean
): Promise<ChatResponse> {
  return invoke("ollama_chat", { model, messages, stream });
}

export async function ollamaRunningModels(): Promise<RunningModel[]> {
  return invoke("ollama_running_models");
}

// Setup commands

export async function detectOs(): Promise<string> {
  return invoke("detect_os");
}

export async function setupCheck(): Promise<SetupStatus> {
  return invoke("setup_check");
}

export async function setupInit(lite: boolean): Promise<void> {
  return invoke("setup_init", { lite });
}

export async function setupAlias(): Promise<void> {
  return invoke("setup_alias");
}

// Diagnostics commands

export async function diagnosticsFull(): Promise<DiagnosticsReport> {
  return invoke("diagnostics_full");
}

export async function systemInfo(): Promise<SystemInfo> {
  return invoke("system_info");
}

// Event listeners

export function onPullProgress(
  callback: (event: PullProgressEvent) => void
): Promise<UnlistenFn> {
  return listen<PullProgressEvent>("pull-progress", (e) => callback(e.payload));
}

export function onChatToken(
  callback: (event: ChatTokenEvent) => void
): Promise<UnlistenFn> {
  return listen<ChatTokenEvent>("chat-token", (e) => callback(e.payload));
}

export function onSetupLog(
  callback: (event: SetupLogEvent) => void
): Promise<UnlistenFn> {
  return listen<SetupLogEvent>("setup-log", (e) => callback(e.payload));
}
