"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Database,
  Layers,
  FileText,
  ArrowUpDown,
  Workflow,
  Cpu,
  Check,
} from "lucide-react";

// Types
interface EmbeddingConfig {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  modelName: string;
  endpoint: string | null;
  apiKey: string | null;
  dimension: number;
  isActive: boolean;
  isDefault: boolean;
}

interface VectorDBConfig {
  id: string;
  name: string;
  displayName: string;
  type: string;
  connectionUrl: string | null;
  apiKey: string | null;
  collectionName: string;
  settings: string | null;
  isActive: boolean;
  isDefault: boolean;
}

interface ChunkConfig {
  id: string;
  name: string;
  displayName: string;
  strategy: string;
  chunkSize: number;
  chunkOverlap: number;
  separators: string | null;
  modelName: string | null;
  endpoint: string | null;
  apiKey: string | null;
  isActive: boolean;
  isDefault: boolean;
}

interface ParserConfig {
  id: string;
  name: string;
  displayName: string;
  type: string;
  modelName: string | null;
  endpoint: string | null;
  apiKey: string | null;
  settings: string | null;
  isActive: boolean;
  isDefault: boolean;
}

interface RerankerConfig {
  id: string;
  name: string;
  displayName: string;
  type: string;
  modelName: string | null;
  endpoint: string | null;
  apiKey: string | null;
  topK: number;
  isActive: boolean;
  isDefault: boolean;
}

interface RAGPipeline {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  embeddingId: string;
  vectorDBId: string;
  chunkId: string;
  parserId: string | null;
  rerankerId: string | null;
  topK: number;
  scoreThreshold: number;
  systemPrompt: string | null;
  contextTemplate: string | null;
  isActive: boolean;
  isDefault: boolean;
  embedding?: EmbeddingConfig;
  vectorDB?: VectorDBConfig;
  chunk?: ChunkConfig;
  parser?: ParserConfig;
  reranker?: RerankerConfig;
}

const TABS = [
  { id: "pipelines", label: "RAG Pipelines", icon: Workflow },
  { id: "embeddings", label: "Embeddings", icon: Cpu },
  { id: "vectordb", label: "Vector DB", icon: Database },
  { id: "chunks", label: "Chunking", icon: Layers },
  { id: "parsers", label: "Parsers", icon: FileText },
  { id: "rerankers", label: "Rerankers", icon: ArrowUpDown },
];

const EMBEDDING_PROVIDERS = ["OLLAMA", "OPENAI", "HUGGINGFACE", "CUSTOM"];
const VECTORDB_TYPES = ["CHROMA", "FAISS", "PGVECTOR", "QDRANT", "WEAVIATE", "PINECONE"];
const CHUNK_STRATEGIES = ["FIXED", "RECURSIVE", "SEMANTIC", "MARKDOWN", "HTML", "CODE"];
const PARSER_TYPES = ["DEFAULT", "UNSTRUCTURED", "PYPDF", "DOCX", "MARKDOWN", "HTML"];
const RERANKER_TYPES = ["NONE", "COHERE", "CROSSENCODER", "COLBERT", "CUSTOM"];

export default function RAGSettingsPage() {
  const [activeTab, setActiveTab] = useState("pipelines");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data states
  const [embeddings, setEmbeddings] = useState<EmbeddingConfig[]>([]);
  const [vectorDBs, setVectorDBs] = useState<VectorDBConfig[]>([]);
  const [chunks, setChunks] = useState<ChunkConfig[]>([]);
  const [parsers, setParsers] = useState<ParserConfig[]>([]);
  const [rerankers, setRerankers] = useState<RerankerConfig[]>([]);
  const [pipelines, setPipelines] = useState<RAGPipeline[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<unknown>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchEmbeddings(),
      fetchVectorDBs(),
      fetchChunks(),
      fetchParsers(),
      fetchRerankers(),
      fetchPipelines(),
    ]);
  };

  const fetchEmbeddings = async () => {
    try {
      const res = await fetch("/api/admin/rag/embeddings");
      if (res.ok) setEmbeddings(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchVectorDBs = async () => {
    try {
      const res = await fetch("/api/admin/rag/vectordb");
      if (res.ok) setVectorDBs(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchChunks = async () => {
    try {
      const res = await fetch("/api/admin/rag/chunks");
      if (res.ok) setChunks(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchParsers = async () => {
    try {
      const res = await fetch("/api/admin/rag/parsers");
      if (res.ok) setParsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRerankers = async () => {
    try {
      const res = await fetch("/api/admin/rag/rerankers");
      if (res.ok) setRerankers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPipelines = async () => {
    try {
      const res = await fetch("/api/admin/rag/pipelines");
      if (res.ok) setPipelines(await res.json());
    } catch (e) { console.error(e); }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(getDefaultFormData());
    setShowModal(true);
  };

  const openEditModal = (item: unknown) => {
    setEditingItem(item);
    setFormData(item as Record<string, unknown>);
    setShowModal(true);
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case "embeddings":
        return { name: "", displayName: "", provider: "OLLAMA", modelName: "nomic-embed-text", endpoint: "", apiKey: "", dimension: 768, isActive: true, isDefault: false };
      case "vectordb":
        return { name: "", displayName: "", type: "CHROMA", connectionUrl: "", apiKey: "", collectionName: "default", isActive: true, isDefault: false };
      case "chunks":
        return { name: "", displayName: "", strategy: "RECURSIVE", chunkSize: 1000, chunkOverlap: 200, modelName: "", endpoint: "", apiKey: "", isActive: true, isDefault: false };
      case "parsers":
        return { name: "", displayName: "", type: "DEFAULT", modelName: "", endpoint: "", apiKey: "", isActive: true, isDefault: false };
      case "rerankers":
        return { name: "", displayName: "", type: "NONE", modelName: "", endpoint: "", apiKey: "", topK: 5, isActive: true, isDefault: false };
      case "pipelines":
        return { name: "", displayName: "", topK: 5, scoreThreshold: 0.7, isActive: true, isDefault: false };
      default:
        return {};
    }
  };

  const getApiPath = () => {
    switch (activeTab) {
      case "embeddings": return "/api/admin/rag/embeddings";
      case "vectordb": return "/api/admin/rag/vectordb";
      case "chunks": return "/api/admin/rag/chunks";
      case "parsers": return "/api/admin/rag/parsers";
      case "rerankers": return "/api/admin/rag/rerankers";
      case "pipelines": return "/api/admin/rag/pipelines";
      default: return "";
    }
  };

  const handleSave = async () => {
    try {
      const isEdit = !!editingItem;
      const url = isEdit ? `${getApiPath()}/${(editingItem as { id: string }).id}` : getApiPath();
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `${isEdit ? "Updated" : "Created"} successfully!` });
        setShowModal(false);
        fetchAllData();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Failed to save" });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to save" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      const res = await fetch(`${getApiPath()}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Deleted successfully!" });
        fetchAllData();
      } else {
        setMessage({ type: "error", text: "Failed to delete" });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to delete" });
    }
  };

  const renderTable = () => {
    switch (activeTab) {
      case "embeddings":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dimension</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {embeddings.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                    {item.endpoint && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.endpoint}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">{item.provider}</span></td>
                  <td className="px-4 py-3 text-sm">{item.modelName}</td>
                  <td className="px-4 py-3 text-center text-sm">{item.dimension}</td>
                  <td className="px-4 py-3 text-center">{item.isDefault && <Check className="w-5 h-5 text-blue-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "vectordb":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vectorDBs.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                    {item.connectionUrl && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.connectionUrl}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{item.type}</span></td>
                  <td className="px-4 py-3 text-sm">{item.collectionName}</td>
                  <td className="px-4 py-3 text-center">{item.isDefault && <Check className="w-5 h-5 text-blue-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "chunks":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chunk Size</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overlap</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chunks.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                    {item.endpoint && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.endpoint}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">{item.strategy}</span></td>
                  <td className="px-4 py-3 text-center text-sm">{item.chunkSize}</td>
                  <td className="px-4 py-3 text-center text-sm">{item.chunkOverlap}</td>
                  <td className="px-4 py-3 text-center">{item.isDefault && <Check className="w-5 h-5 text-blue-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "parsers":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parsers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                    {item.endpoint && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.endpoint}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{item.type}</span></td>
                  <td className="px-4 py-3 text-sm">{item.modelName || "-"}</td>
                  <td className="px-4 py-3 text-center">{item.isDefault && <Check className="w-5 h-5 text-blue-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "rerankers":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Top K</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rerankers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                    {item.endpoint && <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.endpoint}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">{item.type}</span></td>
                  <td className="px-4 py-3 text-sm">{item.modelName || "-"}</td>
                  <td className="px-4 py-3 text-center text-sm">{item.topK}</td>
                  <td className="px-4 py-3 text-center">{item.isDefault && <Check className="w-5 h-5 text-blue-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "pipelines":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Components</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Top K</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pipelines.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.displayName}</div>
                    <div className="text-sm text-gray-500">{item.name}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-1">{item.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 text-xs rounded bg-purple-50 text-purple-700">{item.embedding?.displayName || "N/A"}</span>
                      <span className="px-1.5 py-0.5 text-xs rounded bg-blue-50 text-blue-700">{item.vectorDB?.displayName || "N/A"}</span>
                      <span className="px-1.5 py-0.5 text-xs rounded bg-orange-50 text-orange-700">{item.chunk?.displayName || "N/A"}</span>
                      {item.reranker && <span className="px-1.5 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700">{item.reranker.displayName}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{item.topK}</td>
                  <td className="px-4 py-3 text-center">{item.isDefault && <Check className="w-5 h-5 text-blue-600 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(item)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "embeddings":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input type="text" value={formData.name as string || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="ollama-nomic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input type="text" value={formData.displayName as string || ""} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Ollama Nomic" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select value={formData.provider as string || "OLLAMA"} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  {EMBEDDING_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input type="text" value={formData.modelName as string || ""} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="nomic-embed-text" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                <input type="text" value={formData.endpoint as string || ""} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="http://localhost:11434" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension</label>
                <input type="number" value={formData.dimension as number || 768} onChange={(e) => setFormData({ ...formData, dimension: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input type="password" value={formData.apiKey as string || ""} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive as boolean ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isDefault as boolean ?? false} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>
        );
      case "vectordb":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input type="text" value={formData.name as string || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="chroma-local" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input type="text" value={formData.displayName as string || ""} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Local ChromaDB" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type as string || "CHROMA"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  {VECTORDB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                <input type="text" value={formData.collectionName as string || ""} onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="default" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection URL</label>
              <input type="text" value={formData.connectionUrl as string || ""} onChange={(e) => setFormData({ ...formData, connectionUrl: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="http://localhost:8000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input type="password" value={formData.apiKey as string || ""} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive as boolean ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isDefault as boolean ?? false} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>
        );
      case "chunks":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input type="text" value={formData.name as string || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="recursive-1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input type="text" value={formData.displayName as string || ""} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Recursive 1000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
              <select value={formData.strategy as string || "RECURSIVE"} onChange={(e) => setFormData({ ...formData, strategy: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                {CHUNK_STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunk Size</label>
                <input type="number" value={formData.chunkSize as number || 1000} onChange={(e) => setFormData({ ...formData, chunkSize: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500 mt-1">Number of characters per chunk</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunk Overlap</label>
                <input type="number" value={formData.chunkOverlap as number || 200} onChange={(e) => setFormData({ ...formData, chunkOverlap: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-500 mt-1">Overlap between chunks</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Separators (JSON array)</label>
              <input type="text" value={formData.separators as string || ""} onChange={(e) => setFormData({ ...formData, separators: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder='["\n\n", "\n", " "]' />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input type="text" value={formData.modelName as string || ""} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="For semantic chunking" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                <input type="text" value={formData.endpoint as string || ""} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="http://localhost:11434" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input type="password" value={formData.apiKey as string || ""} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive as boolean ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isDefault as boolean ?? false} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>
        );
      case "parsers":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input type="text" value={formData.name as string || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input type="text" value={formData.displayName as string || ""} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formData.type as string || "DEFAULT"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                {PARSER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input type="text" value={formData.modelName as string || ""} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="For external parser model" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                <input type="text" value={formData.endpoint as string || ""} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="http://localhost:8080" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input type="password" value={formData.apiKey as string || ""} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Settings (JSON)</label>
              <textarea value={formData.settings as string || ""} onChange={(e) => setFormData({ ...formData, settings: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={4} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive as boolean ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isDefault as boolean ?? false} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>
        );
      case "rerankers":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input type="text" value={formData.name as string || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input type="text" value={formData.displayName as string || ""} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type as string || "NONE"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  {RERANKER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Top K</label>
                <input type="number" value={formData.topK as number || 5} onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
              <input type="text" value={formData.modelName as string || ""} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
              <input type="text" value={formData.endpoint as string || ""} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input type="password" value={formData.apiKey as string || ""} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive as boolean ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isDefault as boolean ?? false} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>
        );
      case "pipelines":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                <input type="text" value={formData.name as string || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="default-rag" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                <input type="text" value={formData.displayName as string || ""} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Default RAG Pipeline" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description as string || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Embedding *</label>
                <select value={formData.embeddingId as string || ""} onChange={(e) => setFormData({ ...formData, embeddingId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {embeddings.filter(e => e.isActive).map((e) => <option key={e.id} value={e.id}>{e.displayName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vector DB *</label>
                <select value={formData.vectorDBId as string || ""} onChange={(e) => setFormData({ ...formData, vectorDBId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {vectorDBs.filter(v => v.isActive).map((v) => <option key={v.id} value={v.id}>{v.displayName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunking *</label>
                <select value={formData.chunkId as string || ""} onChange={(e) => setFormData({ ...formData, chunkId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select...</option>
                  {chunks.filter(c => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parser</label>
                <select value={formData.parserId as string || ""} onChange={(e) => setFormData({ ...formData, parserId: e.target.value || null })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">None</option>
                  {parsers.filter(p => p.isActive).map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reranker</label>
                <select value={formData.rerankerId as string || ""} onChange={(e) => setFormData({ ...formData, rerankerId: e.target.value || null })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">None</option>
                  {rerankers.filter(r => r.isActive).map((r) => <option key={r.id} value={r.id}>{r.displayName}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Top K</label>
                <input type="number" value={formData.topK as number || 5} onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score Threshold</label>
                <input type="number" step="0.1" value={formData.scoreThreshold as number || 0.7} onChange={(e) => setFormData({ ...formData, scoreThreshold: parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
              <textarea value={formData.systemPrompt as string || ""} onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" rows={3} placeholder="You are a helpful assistant..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Context Template</label>
              <textarea value={formData.contextTemplate as string || ""} onChange={(e) => setFormData({ ...formData, contextTemplate: e.target.value })} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" rows={3} placeholder="Use the following context to answer:\n{context}" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive as boolean ?? true} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isDefault as boolean ?? false} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" />
                <span className="text-sm">Set as Default</span>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    const isEdit = !!editingItem;
    const prefix = isEdit ? "Edit" : "Add";
    switch (activeTab) {
      case "embeddings": return `${prefix} Embedding Config`;
      case "vectordb": return `${prefix} Vector DB Config`;
      case "chunks": return `${prefix} Chunk Config`;
      case "parsers": return `${prefix} Parser Config`;
      case "rerankers": return `${prefix} Reranker Config`;
      case "pipelines": return `${prefix} RAG Pipeline`;
      default: return prefix;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">RAG Settings</h1>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            {renderTable()}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{getModalTitle()}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{renderForm()}</div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingItem ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
