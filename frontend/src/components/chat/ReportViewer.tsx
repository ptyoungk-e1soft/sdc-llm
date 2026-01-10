"use client";

import {
  X,
  FileText,
  Calendar,
  Building2,
  Package,
  AlertTriangle,
  MapPin,
  Ruler,
  User,
  Users,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Printer,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

interface AnalysisCase {
  id: string;
  caseNumber: string;
  customer: string;
  productModel: string;
  lotId: string;
  cellId: string;
  defectType: string;
  defectDescription: string;
  defectLocation: string | null;
  defectSize: string | null;
  rootCause: string | null;
  analysisResult: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  responsibleDept: string | null;
  responsiblePerson: string | null;
  status: string;
  reportedAt: string;
  analyzedAt: string | null;
  closedAt: string | null;
  tags: string | null;
}

interface ReportViewerProps {
  report: AnalysisCase;
  onClose: () => void;
  onBack: () => void;
}

export function ReportViewer({ report, onClose, onBack }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CLOSED":
        return { label: "종료", color: "bg-gray-100 text-gray-700", icon: CheckCircle2 };
      case "COMPLETED":
        return { label: "완료", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
      case "IN_PROGRESS":
        return { label: "진행중", color: "bg-blue-100 text-blue-700", icon: AlertTriangle };
      default:
        return { label: "대기", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle };
    }
  };

  const getDefectTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      DEAD_PIXEL: "데드 픽셀",
      LINE_DEFECT: "라인 결함",
      MURA: "무라 (얼룩)",
      BRIGHTNESS: "밝기 불량",
      COLOR_SHIFT: "색상 편차",
      CRACK: "크랙",
      CONTAMINATION: "오염",
      OTHER: "기타",
    };
    return types[type] || type;
  };

  const handleCopy = async () => {
    const reportText = `
분석 보고서: ${report.caseNumber}
=====================================

[기본 정보]
- 고객사: ${report.customer}
- 제품모델: ${report.productModel}
- LOT ID: ${report.lotId}
- Cell ID: ${report.cellId}
- 결함유형: ${getDefectTypeLabel(report.defectType)}
- 상태: ${getStatusInfo(report.status).label}

[일자]
- 접수일: ${formatDate(report.reportedAt)}
- 분석완료일: ${formatDate(report.analyzedAt)}
- 종료일: ${formatDate(report.closedAt)}

[결함 정보]
- 위치: ${report.defectLocation || "-"}
- 크기: ${report.defectSize || "-"}
- 설명: ${report.defectDescription}

[분석 결과]
- 근본 원인: ${report.rootCause || "-"}
- 분석 결과: ${report.analysisResult || "-"}

[조치 사항]
- 시정 조치: ${report.correctiveAction || "-"}
- 예방 조치: ${report.preventiveAction || "-"}

[담당]
- 귀책부서: ${report.responsibleDept || "-"}
- 담당자: ${report.responsiblePerson || "-"}
    `.trim();

    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusInfo = getStatusInfo(report.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[1000px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-orange-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {report.caseNumber}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {report.customer} / {report.productModel}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-orange-100 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>복사</span>
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Info */}
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">고객사</span>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {report.customer}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">제품모델</span>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      {report.productModel}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">LOT ID</span>
                    <p className="font-medium text-gray-900">{report.lotId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cell ID</span>
                    <p className="font-medium text-gray-900">{report.cellId}</p>
                  </div>
                </div>
              </section>

              {/* Defect Info */}
              <section className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  결함 정보
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                      {getDefectTypeLabel(report.defectType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">결함 설명</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {report.defectDescription}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> 위치
                      </span>
                      <p className="font-medium text-gray-900">
                        {report.defectLocation || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> 크기
                      </span>
                      <p className="font-medium text-gray-900">
                        {report.defectSize || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  처리 일정
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">접수일</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(report.reportedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">분석완료일</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(report.analyzedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">종료일</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(report.closedAt)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Root Cause */}
              <section className="bg-amber-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  근본 원인
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {report.rootCause || "분석 중..."}
                </p>
              </section>

              {/* Analysis Result */}
              <section className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  분석 결과
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {report.analysisResult || "분석 중..."}
                </p>
              </section>

              {/* Actions */}
              <section className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  조치 사항
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">시정 조치</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {report.correctiveAction || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">예방 조치</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {report.preventiveAction || "-"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Responsible */}
              <section className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  담당 정보
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> 귀책부서
                    </span>
                    <p className="font-medium text-gray-900">
                      {report.responsibleDept || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> 담당자
                    </span>
                    <p className="font-medium text-gray-900">
                      {report.responsiblePerson || "-"}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            보고서 ID: {report.id}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              목록으로
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
