import { atom } from "jotai";
import type { ChatMessage } from "@/types";

export const sidebarCollapsedAtom = atom<boolean>(false);

export const chatMessagesAtom = atom<ChatMessage[]>([]);

export const chatLoadingAtom = atom<boolean>(false);
