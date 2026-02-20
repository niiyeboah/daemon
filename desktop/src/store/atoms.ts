import { atom } from "jotai";
import type { OllamaStatus, ModelInfo, ChatMessage } from "@/types";

export const ollamaStatusAtom = atom<OllamaStatus>({
  installed: false,
  api_reachable: false,
  version: null,
});

export const modelsAtom = atom<ModelInfo[]>([]);

export const selectedModelAtom = atom<string>("daemon");

export const sidebarCollapsedAtom = atom<boolean>(false);

export const chatMessagesAtom = atom<ChatMessage[]>([]);

export const chatLoadingAtom = atom<boolean>(false);
