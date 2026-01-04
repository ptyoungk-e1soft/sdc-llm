"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

// Helper function to extract text content from message parts
function getMessageContent(message: Message): string {
  if (!message.parts || message.parts.length === 0) {
    return "";
  }

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Start a conversation
          </h2>
          <p className="text-gray-500">
            Type a message below to begin chatting with the AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={getMessageContent(message)}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3 px-4 py-4 bg-gray-50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
