import { useCallback, useEffect, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  ollamaStatusAtom,
  modelsAtom,
  selectedModelAtom,
  chatMessagesAtom,
  chatLoadingAtom,
} from "@/store/atoms";
import {
  ollamaCheck,
  ollamaListModels,
  ollamaChat,
  onChatToken,
} from "@/lib/tauri";
import { OLLAMA_POLL_INTERVAL } from "@/store/constants";
import type { ChatMessage, Message } from "@/types";

export function useOllamaStatus() {
  const [status, setStatus] = useAtom(ollamaStatusAtom);

  const refresh = useCallback(async () => {
    try {
      const result = await ollamaCheck();
      setStatus(result);
    } catch {
      setStatus({ installed: false, api_reachable: false, version: null });
    }
  }, [setStatus]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, OLLAMA_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, refresh };
}

export function useOllamaModels() {
  const [models, setModels] = useAtom(modelsAtom);

  const refresh = useCallback(async () => {
    try {
      const result = await ollamaListModels();
      setModels(result);
    } catch {
      setModels([]);
    }
  }, [setModels]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { models, refresh };
}

export function useOllamaChat() {
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const [loading, setLoading] = useAtom(chatLoadingAtom);
  const [model] = useAtom(selectedModelAtom);
  const streamContentRef = useRef("");

  const sendMessage = useCallback(
    async (content: string) => {
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

        const response = await ollamaChat(model, apiMessages, true);

        // Update with final stats
        setMessages((prev) =>
          prev.map((m) =>
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
          )
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    streamContentRef.current ||
                    `Error: ${err instanceof Error ? err.message : String(err)}`,
                }
              : m
          )
        );
      } finally {
        unlisten();
        setLoading(false);
      }
    },
    [messages, model, setMessages, setLoading]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return { messages, loading, sendMessage, clearChat };
}

export function useModelSelector() {
  const [model, setModel] = useAtom(selectedModelAtom);
  return { model, setModel };
}
