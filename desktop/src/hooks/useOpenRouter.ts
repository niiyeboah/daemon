import { useCallback, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { load } from "@tauri-apps/plugin-store";
import { chatMessagesAtom, chatLoadingAtom } from "@/store/atoms";
import { openrouterChat, onChatToken } from "@/lib/tauri";
import { useSettings } from "@/hooks/useSettings";
import { SIMPLE_MODEL, COMPLEX_MODEL, DEFAULT_TASK_COMPLEXITY } from "@/store/constants";
import type { ChatMessage, Message } from "@/types";

const CHAT_STORE_PATH = "chat.json";
const CHAT_STORE_KEY = "chatHistory";

async function persistMessages(messages: ChatMessage[]) {
  try {
    const store = await load(CHAT_STORE_PATH, { defaults: {}, autoSave: true });
    await store.set(CHAT_STORE_KEY, messages);
  } catch {
    // Silently fail — persistence is best-effort
  }
}

async function loadPersistedMessages(): Promise<ChatMessage[]> {
  try {
    const store = await load(CHAT_STORE_PATH, { defaults: {}, autoSave: true });
    const history = await store.get<ChatMessage[]>(CHAT_STORE_KEY);
    return history ?? [];
  } catch {
    return [];
  }
}

export function useOpenRouterChat() {
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const [loading, setLoading] = useAtom(chatLoadingAtom);
  const { openrouterApiKey, taskComplexity = DEFAULT_TASK_COMPLEXITY } = useSettings();
  
  const streamContentRef = useRef("");
  const loadedRef = useRef(false);

  // Load persisted chat history on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadPersistedMessages().then((history) => {
      if (history.length > 0) {
        setMessages(history);
      }
    });
  }, [setMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!openrouterApiKey) {
        alert("Please set your OpenRouter API key in Settings first.");
        return;
      }

      const model = taskComplexity === "complex" ? COMPLEX_MODEL : SIMPLE_MODEL;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
        model,
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      streamContentRef.current = "";

      // Create placeholder for assistant message
      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        model,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Set up streaming listener
      const unlisten = await onChatToken((event) => {
        streamContentRef.current += event.content;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: streamContentRef.current }
              : m
          )
        );
      });

      try {
        // Build message history for API
        const apiMessages: Message[] = messages
          .concat(userMsg)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await openrouterChat(model, apiMessages, openrouterApiKey, true);

        // Update with final stats and persist
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: response.message.content || streamContentRef.current,
                  stats: response.tokens_per_second
                    ? {
                        tokensGenerated: response.eval_count ?? 0,
                        durationMs: response.total_duration
                          ? response.total_duration / 1_000_000
                          : 0,
                        tokensPerSecond: response.tokens_per_second,
                      }
                    : undefined,
                }
              : m
          );
          persistMessages(updated);
          return updated;
        });
      } catch (err) {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    streamContentRef.current ||
                    `Error: ${err instanceof Error ? err.message : String(err)}`,
                }
              : m
          );
          persistMessages(updated);
          return updated;
        });
      } finally {
        unlisten();
        setLoading(false);
      }
    },
    [messages, taskComplexity, openrouterApiKey, setMessages, setLoading]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    persistMessages([]);
  }, [setMessages]);

  return { messages, loading, sendMessage, clearChat };
}
