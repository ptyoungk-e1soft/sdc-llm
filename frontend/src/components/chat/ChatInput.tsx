"use client";

import { useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  selectedModel?: string;
}

export function ChatInput({
  value = "",
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message...",
  selectedModel,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-gray-400 focus-within:border-transparent">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm leading-relaxed",
            "min-h-[24px] max-h-[200px]"
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || isLoading || disabled}
          className="h-8 w-8 flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 mt-1">
        {selectedModel && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Bot className="h-3 w-3" />
            {selectedModel}
          </span>
        )}
        <span className="text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </form>
  );
}
