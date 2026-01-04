"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import { useModelStore } from "@/stores/modelStore";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ChatPage() {
  const router = useRouter();
  const { createChat, isLoading } = useChatStore();
  const { selectedModel } = useModelStore();

  const handleNewChat = async () => {
    const chat = await createChat(selectedModel);
    if (chat) {
      router.push(`/chat/${chat.id}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <MessageSquarePlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Welcome to e1soft LLM
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Start a new conversation with your local AI assistant.
        </p>
        <Button onClick={handleNewChat} disabled={isLoading}>
          {isLoading ? "Creating..." : "Start New Chat"}
        </Button>
      </div>
    </div>
  );
}
