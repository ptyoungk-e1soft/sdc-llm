"use client";

import { useState, FormEvent, useCallback } from "react";
import { useModelStore } from "@/stores/modelStore";
import { useChatStore } from "@/stores/chatStore";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { LangGraphDebugPanel } from "./LangGraphDebugPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
}

interface StreamStats {
  total_tokens: number;
  total_time_ms: number;
  ttft_ms: number;
  tokens_per_sec: number;
  model: string;
  node: string;
}

interface ChatContainerProps {
  chatId: string;
  initialMessages?: Message[];
}

export function ChatContainer({ chatId, initialMessages = [] }: ChatContainerProps) {
  const { selectedModel } = useModelStore();
  const { updateChat } = useChatStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [streamStats, setStreamStats] = useState<StreamStats | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Reset debug state
    if (debugMode) {
      setCurrentNode(null);
      setTokenCount(0);
      setElapsedMs(0);
      setStreamStats(null);
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      parts: [{ type: "text", text: content }],
    };

    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((prev) => [...prev, userMessage]);

    // Update chat title if first message
    if (messages.length === 0) {
      const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      updateChat(chatId, { title });
    }

    // Add empty assistant message for streaming
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      },
    ]);

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.parts.map((p) => p.text).join(""),
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          chatId,
          debug: debugMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const content = JSON.parse(line.slice(2));
              assistantContent += content;

              // Update the assistant message with streaming content
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, parts: [{ type: "text", text: assistantContent }] }
                    : msg
                )
              );
            } catch {
              // Skip invalid JSON
            }
          }
          // Handle debug events
          if (line.startsWith("d:")) {
            try {
              const debugData = JSON.parse(line.slice(2));
              if (debugData.type === "graph_start") {
                setCurrentNode(debugData.node);
              } else if (debugData.type === "token") {
                setTokenCount(debugData.token_index);
                setElapsedMs(debugData.elapsed_ms);
              } else if (debugData.type === "graph_end" && debugData.stats) {
                setCurrentNode(null);
                setStreamStats(debugData.stats);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to send message"));
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [chatId, isLoading, messages, selectedModel, updateChat, debugMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput("");
    await sendMessage(messageContent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Debug Toggle */}
      <div className="flex justify-end px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            debugMode
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          LangGraph Debug
          {debugMode && <span className="w-2 h-2 bg-green-500 rounded-full" />}
        </button>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="px-4 py-2">
          <LangGraphDebugPanel
            isStreaming={isLoading}
            currentNode={currentNode}
            tokenCount={tokenCount}
            elapsedMs={elapsedMs}
            stats={streamStats}
          />
        </div>
      )}

      {/* Messages Area - Takes up remaining space */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Type your message..."
            selectedModel={selectedModel}
          />
        </div>
      </div>
    </div>
  );
}
