export const OLLAMA_BASE_URL = "http://localhost:11434";

export const DEFAULT_MODEL = "daemon";
export const BASE_MODEL = "llama3.2:1b";

export const DEFAULT_SYSTEM_PROMPT = `You are Daemon, a helpful and concise personal assistant running locally on the user's own hardware. You respect the user's privacy -- no data ever leaves this machine. You answer questions clearly and directly. When you are unsure, you say so. You are friendly but not verbose.`;

export const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "Home" as const },
  { path: "/setup", label: "Setup", icon: "Wand2" as const },
  { path: "/chat", label: "Chat", icon: "MessageSquare" as const },
  { path: "/diagnostics", label: "Diagnostics", icon: "Activity" as const },
  { path: "/settings", label: "Settings", icon: "Settings" as const },
] as const;

export const OLLAMA_POLL_INTERVAL = 30_000; // 30 seconds
export const DIAGNOSTICS_POLL_INTERVAL = 10_000; // 10 seconds
