"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "px-4 py-4 border-b border-gray-200",
        isUser ? "bg-transparent" : "bg-white"
      )}
    >
      {isUser ? (
        <div className="flex justify-end">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{content}</p>
        </div>
      ) : (
        <div className="relative group w-full">
          <div className="text-sm text-gray-800 w-full">
            <MarkdownRenderer content={content} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3 text-gray-400" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
