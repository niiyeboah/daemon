export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const SIMPLE_MODEL = "google/gemini-2.5-flash";
export const COMPLEX_MODEL = "anthropic/claude-3.5-sonnet";

export const DEFAULT_TASK_COMPLEXITY = "simple";

export const DEFAULT_SYSTEM_PROMPT = `You are Daemon, a helpful and concise personal assistant. You answer questions clearly and directly. When you are unsure, you say so. You are friendly but not verbose.`;

export const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "Home" as const },
  { path: "/setup", label: "Setup", icon: "Wand2" as const },
  { path: "/chat", label: "Chat", icon: "MessageSquare" as const },
  { path: "/diagnostics", label: "Diagnostics", icon: "Activity" as const },
  { path: "/whatsapp", label: "WhatsApp", icon: "Smartphone" as const },
  { path: "/settings", label: "Settings", icon: "Settings" as const },
] as const;

export const OLLAMA_POLL_INTERVAL = 30_000; // 30 seconds
export const DIAGNOSTICS_POLL_INTERVAL = 10_000; // 10 seconds
