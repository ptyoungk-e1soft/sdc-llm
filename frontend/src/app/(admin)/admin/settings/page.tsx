"use client";

import { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Key,
  Globe,
} from "lucide-react";

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  provider: "OLLAMA" | "OPENAI" | "ANTHROPIC" | "CUSTOM";
  endpoint: string | null;
  apiKey: string | null;
  isActive: boolean;
  isDefault: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string | null;
}

const PROVIDERS = [
  { value: "OLLAMA", label: "Ollama (로컬)" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "ANTHROPIC", label: "Anthropic" },
  { value: "CUSTOM", label: "Custom API" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    "llm.defaultModel": "qwen3:32b",
    "llm.temperature": "0.7",
    "llm.maxTokens": "4096",
    "llm.systemPrompt":
      "You are a helpful AI assistant. Respond in the same language as the user.",
    "llm.ollamaHost": "http://localhost:11434",
  });
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [customModels, setCustomModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Model Form State
  const [showModelForm, setShowModelForm] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [modelForm, setModelForm] = useState<Partial<ModelConfig>>({
    name: "",
    displayName: "",
    provider: "OLLAMA",
    endpoint: "",
    apiKey: "",
    isActive: true,
    isDefault: false,
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchOllamaModels();
    fetchCustomModels();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOllamaModels = async () => {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setOllamaModels(data.models || []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const fetchCustomModels = async () => {
    try {
      const res = await fetch("/api/admin/models");
      if (res.ok) {
        const data = await res.json();
        setCustomModels(data);
      }
    } catch (error) {
      console.error("Error fetching custom models:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      "llm.defaultModel": "qwen3:32b",
      "llm.temperature": "0.7",
      "llm.maxTokens": "4096",
      "llm.systemPrompt":
        "You are a helpful AI assistant. Respond in the same language as the user.",
      "llm.ollamaHost": "http://localhost:11434",
    });
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + " GB";
  };

  // Model CRUD
  const openAddModelForm = () => {
    setEditingModel(null);
    setModelForm({
      name: "",
      displayName: "",
      provider: "OLLAMA",
      endpoint: "",
      apiKey: "",
      isActive: true,
      isDefault: false,
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: "",
    });
    setShowApiKey(false);
    setShowModelForm(true);
  };

  const openEditModelForm = (model: ModelConfig) => {
    setEditingModel(model);
    setModelForm({
      ...model,
      endpoint: model.endpoint || "",
      apiKey: model.apiKey || "",
      systemPrompt: model.systemPrompt || "",
    });
    setShowApiKey(false);
    setShowModelForm(true);
  };

  const closeModelForm = () => {
    setShowModelForm(false);
    setEditingModel(null);
    setModelForm({});
  };

  const handleSaveModel = async () => {
    try {
      const url = editingModel
        ? `/api/admin/models/${editingModel.id}`
        : "/api/admin/models";

      const method = editingModel ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelForm),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: editingModel ? "Model updated!" : "Model added!",
        });
        closeModelForm();
        fetchCustomModels();
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save model" });
      }
    } catch (error) {
      console.error("Error saving model:", error);
      setMessage({ type: "error", text: "Failed to save model" });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const res = await fetch(`/api/admin/models/${modelId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Model deleted!" });
        fetchCustomModels();
      } else {
        setMessage({ type: "error", text: "Failed to delete model" });
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      setMessage({ type: "error", text: "Failed to delete model" });
    }
  };

  const toggleModelActive = async (model: ModelConfig) => {
    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !model.isActive }),
      });

      if (res.ok) {
        fetchCustomModels();
      }
    } catch (error) {
      console.error("Error toggling model:", error);
    }
  };

  const setDefaultModel = async (model: ModelConfig) => {
    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        fetchCustomModels();
        setMessage({ type: "success", text: `${model.displayName} set as default!` });
      }
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "OLLAMA":
        return "bg-purple-100 text-purple-800";
      case "OPENAI":
        return "bg-green-100 text-green-800";
      case "ANTHROPIC":
        return "bg-orange-100 text-orange-800";
      case "CUSTOM":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">LLM Settings</h1>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Model Configuration Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Model Configuration
          </h2>
          <button
            onClick={openAddModelForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>

        {/* Custom Models List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Default
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customModels.length > 0 ? (
                customModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {model.displayName}
                        </div>
                        <div className="text-sm text-gray-500">{model.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(
                          model.provider
                        )}`}
                      >
                        {model.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {model.endpoint ? (
                          <>
                            <Globe className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">
                              {model.endpoint}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">Default</span>
                        )}
                      </div>
                      {model.apiKey && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Key className="w-3 h-3" />
                          API Key configured
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleModelActive(model)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          model.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {model.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {model.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <button
                          onClick={() => setDefaultModel(model)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Set as default"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModelForm(model)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No custom models configured. Click &quot;Add Model&quot; to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Form Modal */}
      {showModelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingModel ? "Edit Model" : "Add New Model"}
              </h3>
              <button
                onClick={closeModelForm}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model ID *
                  </label>
                  <input
                    type="text"
                    value={modelForm.name || ""}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, name: e.target.value })
                    }
                    placeholder="e.g., gpt-4, llama3, claude-3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The model identifier used by the API
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={modelForm.displayName || ""}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, displayName: e.target.value })
                    }
                    placeholder="e.g., GPT-4 Turbo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name shown in the UI
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={modelForm.provider || "OLLAMA"}
                  onChange={(e) =>
                    setModelForm({
                      ...modelForm,
                      provider: e.target.value as ModelConfig["provider"],
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={modelForm.endpoint || ""}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, endpoint: e.target.value })
                  }
                  placeholder="e.g., https://api.openai.com/v1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use the provider&apos;s default endpoint
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={modelForm.apiKey || ""}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, apiKey: e.target.value })
                    }
                    placeholder="Enter API key"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for OpenAI, Anthropic, and most custom APIs
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature: {modelForm.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={modelForm.temperature || 0.7}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Precise (0)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={modelForm.maxTokens || 4096}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        maxTokens: parseInt(e.target.value),
                      })
                    }
                    min="256"
                    max="128000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt
                </label>
                <textarea
                  value={modelForm.systemPrompt || ""}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, systemPrompt: e.target.value })
                  }
                  rows={4}
                  placeholder="Optional system prompt for this model..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modelForm.isActive ?? true}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modelForm.isDefault ?? false}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, isDefault: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as Default</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={closeModelForm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingModel ? "Update Model" : "Add Model"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Default Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Model
              </label>
              <select
                value={settings["llm.defaultModel"]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    "llm.defaultModel": e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <optgroup label="Custom Models">
                  {customModels
                    .filter((m) => m.isActive)
                    .map((model) => (
                      <option key={model.id} value={model.name}>
                        {model.displayName}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Ollama Models">
                  {ollamaModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({formatSize(model.size)})
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The model used by default for new chats.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {settings["llm.temperature"]}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings["llm.temperature"]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    "llm.temperature": e.target.value,
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Precise (0)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={settings["llm.maxTokens"]}
                onChange={(e) =>
                  setSettings({ ...settings, "llm.maxTokens": e.target.value })
                }
                min="256"
                max="32768"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum number of tokens in the response.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connection Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ollama Host URL
              </label>
              <input
                type="text"
                value={settings["llm.ollamaHost"]}
                onChange={(e) =>
                  setSettings({ ...settings, "llm.ollamaHost": e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                The URL of the Ollama server.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Ollama Models
              </label>
              <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                {ollamaModels.length > 0 ? (
                  ollamaModels.map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatSize(model.size)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No models available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Default System Prompt
          </h2>

          <div>
            <textarea
              value={settings["llm.systemPrompt"]}
              onChange={(e) =>
                setSettings({ ...settings, "llm.systemPrompt": e.target.value })
              }
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              The system prompt that defines the AI assistant&apos;s behavior (used
              when model has no custom prompt).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
