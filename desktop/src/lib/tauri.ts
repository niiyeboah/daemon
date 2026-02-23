import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  Message,
  ChatResponse,
  ChatTokenEvent,
  SetupLogEvent,
  DiagnosticsReport,
  SystemInfo,
  OpenClawStatus,
  OpenClawLogEvent,
  OpenClawQrEvent,
  ApiKeysStatus,
} from "@/types";

// OpenRouter commands

export async function openrouterChat(
  model: string,
  messages: Message[],
  apiKey: string,
  stream: boolean
): Promise<ChatResponse> {
  return invoke("openrouter_chat", { model, messages, apiKey, stream });
}

export async function openrouterTestKey(apiKey: string): Promise<void> {
  return invoke("openrouter_test_key", { apiKey });
}

// Setup commands

export async function detectOs(): Promise<string> {
  return invoke("detect_os");
}

// Diagnostics commands

export async function diagnosticsFull(apiKey: string): Promise<DiagnosticsReport> {
  return invoke("diagnostics_full", { apiKey });
}

export async function systemInfo(): Promise<SystemInfo> {
  return invoke("system_info");
}

// Event listeners

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

// OpenClaw commands

export async function openclawCheck(): Promise<OpenClawStatus> {
  return invoke("openclaw_check");
}

export async function openclawInstall(): Promise<void> {
  return invoke("openclaw_install");
}

export async function openclawOnboard(): Promise<void> {
  return invoke("openclaw_onboard");
}

export async function openclawConnectWhatsapp(): Promise<void> {
  return invoke("openclaw_connect_whatsapp");
}

export async function openclawConfigureModel(model: string, apiKey: string): Promise<void> {
  return invoke("openclaw_configure_model", { model, apiKey });
}

export async function openclawGatewayRestart(): Promise<void> {
  return invoke("openclaw_gateway_restart");
}

export async function openclawGetApiKeys(): Promise<ApiKeysStatus> {
  return invoke("openclaw_get_api_keys");
}

export async function openclawSetApiKey(provider: string, key: string): Promise<void> {
  return invoke("openclaw_set_api_key", { provider, key });
}

export async function openclawRemoveApiKey(provider: string): Promise<void> {
  return invoke("openclaw_remove_api_key", { provider });
}

// OpenClaw event listeners

export function onOpenClawLog(
  callback: (event: OpenClawLogEvent) => void
): Promise<UnlistenFn> {
  return listen<OpenClawLogEvent>("openclaw-log", (e) => callback(e.payload));
}

export function onOpenClawQr(
  callback: (event: OpenClawQrEvent) => void
): Promise<UnlistenFn> {
  return listen<OpenClawQrEvent>("openclaw-qr", (e) => callback(e.payload));
}
