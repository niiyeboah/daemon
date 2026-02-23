import { useOpenRouterChat } from "@/hooks/useOpenRouter";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ComplexitySelector } from "@/components/chat/ComplexitySelector";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const { messages, loading, sendMessage, clearChat } = useOpenRouterChat();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <ComplexitySelector />
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

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
