export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const SIMPLE_MODEL = "google/gemini-2.5-flash";
export const COMPLEX_MODEL = "anthropic/claude-3.5-sonnet";

export const DEFAULT_TASK_COMPLEXITY = "simple";

export const DEFAULT_SYSTEM_PROMPT = `You are Daemon, an advanced, locally-managed personal assistant bot connected to powerful cloud LLMs.
Your primary directive is to be exceptionally helpful, concise, and direct.

Behavioral Guidelines:
1. Direct Answers: Answer questions clearly without unnecessary preamble or polite filler (e.g., skip "Sure, I can help with that").
2. Context Awareness: Remember that you exist as a desktop interface on the user's local machine, though your intelligence is powered by OpenRouter cloud models.
3. Formatting: Use Markdown extensively. Format code snippets with proper language tags, use bullet points for lists, and bold key terms for readability.
4. Honesty: If you are unsure or lack the context to answer a question, state so immediately.
5. Task Complexity: Adjust your depth based on the user's request. For simple tasks, be brief. For complex configurations or coding tasks, provide complete, copy-paste-ready solutions.`;

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
