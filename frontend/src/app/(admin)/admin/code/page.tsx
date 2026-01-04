"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Save,
  RefreshCw,
  File,
  FolderOpen,
  AlertCircle,
  Check,
  Code,
  Play,
} from "lucide-react";

// Monaco Editor를 동적으로 불러오기 (SSR 비활성화)
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface FileInfo {
  path: string;
  name: string;
  type: string;
}

export default function CodeEditorPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/admin/code");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error("Error fetching files:", e);
    }
  };

  const loadFile = useCallback(async (filePath: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/code?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setOriginalContent(data.content);
        setSelectedFile(filePath);
      } else {
        setMessage({ type: "error", text: "Failed to load file" });
      }
    } catch (e) {
      console.error("Error loading file:", e);
      setMessage({ type: "error", text: "Failed to load file" });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveFile = async () => {
    if (!selectedFile) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedFile, content }),
      });

      if (res.ok) {
        setOriginalContent(content);
        setMessage({ type: "success", text: "File saved successfully! Server will auto-reload." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save file" });
      }
    } catch (e) {
      console.error("Error saving file:", e);
      setMessage({ type: "error", text: "Failed to save file" });
    } finally {
      setSaving(false);
    }
  };

  const reloadFile = async () => {
    if (selectedFile) {
      if (hasChanges && !confirm("You have unsaved changes. Reload anyway?")) {
        return;
      }
      await loadFile(selectedFile);
    }
  };

  const hasChanges = content !== originalContent;

  const getFilesByType = (type: string) => files.filter((f) => f.type === type);

  const groupedFiles = {
    chains: getFilesByType("chains"),
    graphs: getFilesByType("graphs"),
    routes: getFilesByType("routes"),
  };

  return (
    <div className="h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Code className="w-6 h-6" />
          LangChain/LangGraph Code Editor
        </h1>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={reloadFile}
            disabled={!selectedFile || loading}
            className="flex items-center gap-1 px-3 py-1.5 text-gray-700 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
          <button
            onClick={saveFile}
            disabled={!selectedFile || saving || !hasChanges}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : message.type === "warning"
              ? "bg-amber-50 text-amber-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex gap-4 h-full">
        {/* File Tree */}
        <div className="w-64 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 border-b font-medium text-sm text-gray-700">
            Backend Files
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {Object.entries(groupedFiles).map(([type, typeFiles]) => (
              <div key={type} className="mb-3">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase mb-1 px-2">
                  <FolderOpen className="w-3 h-3" />
                  {type}
                </div>
                {typeFiles.length > 0 ? (
                  typeFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => loadFile(file.path)}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded flex items-center gap-2 ${
                        selectedFile === file.path
                          ? "bg-blue-100 text-blue-800"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <File className="w-3.5 h-3.5" />
                      {file.name}
                      {selectedFile === file.path && hasChanges && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ml-auto" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-1.5 text-sm text-gray-400">No files</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{selectedFile}</span>
                  {hasChanges && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                      Modified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Play className="w-3 h-3" />
                  Auto-reload on save (uvicorn --reload)
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language="python"
                  theme="vs-light"
                  value={content}
                  onChange={(value) => setContent(value || "")}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    tabSize: 4,
                    insertSpaces: true,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a file from the sidebar to edit</p>
                <p className="text-sm mt-2">
                  You can edit LangChain chains and LangGraph graphs directly
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Code Editor Guide</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>chains/</strong>: LangChain chains (chat_chain.py, etc.)
          </li>
          <li>
            <strong>graphs/</strong>: LangGraph graphs (chat_graph.py, etc.)
          </li>
          <li>
            <strong>routes/</strong>: API routes for LangServe
          </li>
          <li className="text-blue-600">
            Changes are automatically applied when saved (uvicorn --reload is enabled)
          </li>
        </ul>
      </div>
    </div>
  );
}
