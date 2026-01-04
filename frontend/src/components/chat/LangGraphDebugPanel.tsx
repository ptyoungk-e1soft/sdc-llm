"use client";

import { useState, useEffect } from "react";

interface GraphInfo {
  name: string;
  description: string;
  nodes: { id: string; name: string; description: string; type: string }[];
  edges: { from: string; to: string }[];
  features: string[];
}

interface StreamStats {
  total_tokens: number;
  total_time_ms: number;
  ttft_ms: number;
  tokens_per_sec: number;
  model: string;
  node: string;
}

interface LangGraphDebugPanelProps {
  isStreaming: boolean;
  currentNode: string | null;
  tokenCount: number;
  elapsedMs: number;
  stats: StreamStats | null;
}

export function LangGraphDebugPanel({
  isStreaming,
  currentNode,
  tokenCount,
  elapsedMs,
  stats,
}: LangGraphDebugPanelProps) {
  const [graphInfo, setGraphInfo] = useState<GraphInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Fetch graph info from backend
    fetch("/api/graph/info")
      .then((res) => res.json())
      .then(setGraphInfo)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-800 flex items-center justify-between hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-400"
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
          <span className="font-semibold">LangGraph Debug</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Streaming
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Graph Visualization */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Graph Flow</h3>
            <div className="flex items-center justify-center gap-2 py-3">
              {/* Start Node */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 mt-1">START</span>
              </div>

              {/* Arrow */}
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              {/* Chat Node */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                    currentNode === "chat"
                      ? "bg-green-500 ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900 animate-pulse"
                      : "bg-gray-700"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-400 mt-1">chat</span>
              </div>

              {/* Arrow */}
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              {/* End Node */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 mt-1">END</span>
              </div>
            </div>
          </div>

          {/* Live Stats */}
          {isStreaming && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Tokens</div>
                <div className="text-xl font-mono text-green-400">{tokenCount}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Elapsed</div>
                <div className="text-xl font-mono text-blue-400">{(elapsedMs / 1000).toFixed(1)}s</div>
              </div>
            </div>
          )}

          {/* Final Stats */}
          {stats && !isStreaming && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Execution Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Total Tokens</div>
                  <div className="text-lg font-mono text-white">{stats.total_tokens}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Total Time</div>
                  <div className="text-lg font-mono text-white">{(stats.total_time_ms / 1000).toFixed(2)}s</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">TTFT</div>
                  <div className="text-lg font-mono text-yellow-400">{stats.ttft_ms}ms</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Speed</div>
                  <div className="text-lg font-mono text-green-400">{stats.tokens_per_sec} t/s</div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Model</div>
                <div className="text-sm font-mono text-purple-400">{stats.model}</div>
              </div>
            </div>
          )}

          {/* Graph Info */}
          {graphInfo && graphInfo.features && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Graph Info</h3>
              <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-1">
                <div className="text-gray-300">{graphInfo.description}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {graphInfo.features.map((feature, i) => (
                    <span key={i} className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
