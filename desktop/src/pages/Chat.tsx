import { useOllamaChat, useOllamaStatus } from "@/hooks/useOllama";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { ConnectionStatus } from "@/components/chat/ConnectionStatus";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const { messages, loading, sendMessage, clearChat } = useOllamaChat();
  const { status, refresh } = useOllamaStatus();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <ModelSelector />
        <Button
          variant="ghost"
          size="xs"
          onClick={clearChat}
          disabled={messages.length === 0}
          className="text-muted-foreground"
        >
          <Trash2 className="size-3" />
          Clear
        </Button>
      </div>

      <ConnectionStatus onReconnect={refresh} />

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={loading || !status.api_reachable} />
    </div>
  );
}
