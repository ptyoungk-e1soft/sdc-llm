"use client";

import { useState } from "react";
import {
  ChevronRight,
  Database,
  FileSearch,
  UserCheck,
  Users,
  Mail,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";

// 분석 단계 정의
export type AnalysisStage =
  | "data_review"
  | "primary_analysis"
  | "customer_contact"
  | "quality_review"
  | "email_discussion"
  | "submit_result";

interface AnalysisAction {
  id: AnalysisStage;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed";
}

interface AnalysisActionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: AnalysisStage;
  onStageSelect: (stage: AnalysisStage) => void;
  completedStages: AnalysisStage[];
  onSave?: () => void;
  isSaving?: boolean;
}

export function AnalysisActionSidebar({
  isOpen,
  onClose,
  currentStage,
  onStageSelect,
  completedStages,
  onSave,
  isSaving = false,
}: AnalysisActionSidebarProps) {
  const actions: AnalysisAction[] = [
    {
      id: "data_review",
      label: "데이터수집 내용 확인",
      description: "수집된 생산/품질 데이터 확인",
      icon: <Database className="w-5 h-5" />,
      status: completedStages.includes("data_review") ? "completed" :
              currentStage === "data_review" ? "in_progress" : "pending",
    },
    {
      id: "primary_analysis",
      label: "1차분석 결과 확인",
      description: "AI 기반 초기 분석 결과 검토",
      icon: <FileSearch className="w-5 h-5" />,
      status: completedStages.includes("primary_analysis") ? "completed" :
              currentStage === "primary_analysis" ? "in_progress" : "pending",
    },
    {
      id: "customer_contact",
      label: "고객담당자 확인",
      description: "고객사 담당자 연락처 및 이력 확인",
      icon: <UserCheck className="w-5 h-5" />,
      status: completedStages.includes("customer_contact") ? "completed" :
              currentStage === "customer_contact" ? "in_progress" : "pending",
    },
    {
      id: "quality_review",
      label: "품질담당자/귀책부서 확인",
      description: "품질 담당자 지정 및 귀책부서 결정",
      icon: <Users className="w-5 h-5" />,
      status: completedStages.includes("quality_review") ? "completed" :
              currentStage === "quality_review" ? "in_progress" : "pending",
    },
    {
      id: "email_discussion",
      label: "분석 협의 메일발송",
      description: "관련 부서 협의 요청 메일 발송",
      icon: <Mail className="w-5 h-5" />,
      status: completedStages.includes("email_discussion") ? "completed" :
              currentStage === "email_discussion" ? "in_progress" : "pending",
    },
    {
      id: "submit_result",
      label: "기본분석 저장",
      description: "기본분석 결과를 저장합니다",
      icon: <Send className="w-5 h-5" />,
      status: completedStages.includes("submit_result") ? "completed" :
              currentStage === "submit_result" ? "in_progress" : "pending",
    },
  ];

  const getStatusIcon = (status: AnalysisAction["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-300" />;
    }
  };

  const getStatusColor = (status: AnalysisAction["status"], isSelected: boolean) => {
    if (isSelected) {
      return "bg-blue-50 border-blue-500 border-l-4";
    }
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-white border-gray-200 hover:bg-gray-50";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">기본분석 진행</h3>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-indigo-200 text-sm mt-1">
          분석 단계를 순차적으로 진행하세요
        </p>
      </div>

      {/* 진행 상태 표시 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">진행률</span>
          <span className="font-medium text-indigo-600">
            {completedStages.length} / {actions.length} 완료
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(completedStages.length / actions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 액션 목록 */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onStageSelect(action.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${getStatusColor(
              action.status,
              currentStage === action.id
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className={`p-2 rounded-lg ${
                  action.status === "completed" ? "bg-green-100 text-green-600" :
                  action.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {action.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-medium text-sm ${
                    action.status === "completed" ? "text-green-700" :
                    action.status === "in_progress" ? "text-blue-700" :
                    "text-gray-700"
                  }`}>
                    {index + 1}. {action.label}
                  </span>
                  {getStatusIcon(action.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              기본분석 저장
            </>
          )}
        </button>
      </div>
    </div>
  );
}
