"use client";

import { useEffect } from "react";
import { Check, RefreshCw, Cpu } from "lucide-react";
import { useModelStore } from "@/stores/modelStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function ModelSidebar() {
  const {
    models,
    selectedModel,
    isLoading,
    error,
    fetchModels,
    setSelectedModel,
  } = useModelStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleRefresh = () => {
    fetchModels();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Models</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoading && "animate-spin")}
          />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {error && (
          <div className="text-center text-red-500 text-sm py-4 px-2">
            {error}
          </div>
        )}

        {!error && models.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 text-sm py-4">
            No models available
          </div>
        )}

        {isLoading && models.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            Loading models...
          </div>
        )}

        <div className="space-y-1">
          {models.map((model) => (
            <div
              key={model.name}
              onClick={() => setSelectedModel(model.name)}
              className={cn(
                "flex items-start gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors",
                selectedModel === model.name
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
              )}
            >
              <Cpu className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {model.name}
                  </span>
                  {selectedModel === model.name && (
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatBytes(model.size)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Selected: <span className="font-medium">{selectedModel}</span>
        </div>
      </div>
    </div>
  );
}
