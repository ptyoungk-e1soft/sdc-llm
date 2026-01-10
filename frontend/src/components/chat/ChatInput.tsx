"use client";

import { useRef, useEffect, KeyboardEvent, ChangeEvent, useState } from "react";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/stores/modelStore";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value = "",
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [mounted, setMounted] = useState(false);
  const models = useModelStore((state) => state.models);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const setSelectedModel = useModelStore((state) => state.setSelectedModel);
  const fetchModels = useModelStore((state) => state.fetchModels);
  const initializeStore = useModelStore((state) => state.initializeStore);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle client-side mounting and initialize store
  useEffect(() => {
    setMounted(true);
    initializeStore?.();
  }, [initializeStore]);

  // Fetch models on mount
  useEffect(() => {
    if (mounted && models?.length === 0) {
      fetchModels?.();
    }
  }, [mounted, models?.length, fetchModels]);

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
      <div className="flex items-center justify-center gap-3 mt-2">
        {mounted && (
          <div className="relative">
            <select
              value={selectedModel || ""}
              onChange={(e) => setSelectedModel?.(e.target.value)}
              disabled={isLoading}
              className={cn(
                "appearance-none bg-gray-100 border border-gray-200 rounded-md",
                "pl-3 pr-8 py-1.5 text-xs text-gray-600",
                "focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400",
                "cursor-pointer hover:bg-gray-150 transition-colors",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {models && models.length > 0 ? (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))
              ) : (
                <option value={selectedModel || ""}>{selectedModel || "Loading..."}</option>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
        )}
        <span className="text-xs text-gray-400">
          Enter to send, Shift+Enter for new line
        </span>
      </div>
    </form>
  );
}
