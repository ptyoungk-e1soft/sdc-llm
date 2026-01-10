"use client";

import { useState } from "react";
import {
  Database,
  Factory,
  AlertTriangle,
  Settings,
  FileCode,
  GitBranch,
  ChevronRight,
  X,
} from "lucide-react";

interface DataCollectionMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  message: string;
}

const DATA_COLLECTION_MENU: DataCollectionMenuItem[] = [
  {
    id: "production",
    label: "생산 실적 이력",
    icon: <Factory className="w-5 h-5" />,
    message: "생산 실적 이력을 확인해주세요.",
  },
  {
    id: "quality",
    label: "품질검사/불량이력",
    icon: <AlertTriangle className="w-5 h-5" />,
    message: "품질검사 및 불량이력을 조회해주세요.",
  },
  {
    id: "process",
    label: "공정/설비이력",
    icon: <Settings className="w-5 h-5" />,
    message: "공정 및 설비 이력을 확인해주세요.",
  },
  {
    id: "development",
    label: "개발 이력",
    icon: <FileCode className="w-5 h-5" />,
    message: "개발 이력 데이터를 조회해주세요.",
  },
  {
    id: "changes",
    label: "변경점 이력",
    icon: <GitBranch className="w-5 h-5" />,
    message: "변경점 이력을 확인해주세요.",
  },
];

interface DataCollectionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMenu: (message: string) => void;
  selectedMenuId?: string;
}

export function DataCollectionSidebar({
  isOpen,
  onClose,
  onSelectMenu,
  selectedMenuId,
}: DataCollectionSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-2 text-white">
          <Database className="w-5 h-5" />
          <h3 className="font-semibold">데이터 수집</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/20 transition-colors text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {DATA_COLLECTION_MENU.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.message)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                selectedMenuId === item.id
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : hoveredId === item.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-colors ${
                  selectedMenuId === item.id
                    ? "bg-blue-200 text-blue-700"
                    : hoveredId === item.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                }`}
              >
                {item.icon}
              </div>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  selectedMenuId === item.id || hoveredId === item.id
                    ? "translate-x-1 text-blue-500"
                    : "text-gray-400"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          원하는 데이터 유형을 선택하여 조회하세요.
        </p>
      </div>
    </div>
  );
}
