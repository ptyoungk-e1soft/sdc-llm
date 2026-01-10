"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Calendar,
  Building2,
  Package,
  AlertTriangle,
  ChevronRight,
  Search,
  Loader2,
  Eye,
} from "lucide-react";

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

interface ReportListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReport: (report: AnalysisCase) => void;
  selectedTarget?: {
    customer: string;
    productModel: string;
    defectType: string;
  } | null;
}

export function ReportListModal({
  isOpen,
  onClose,
  onViewReport,
  selectedTarget,
}: ReportListModalProps) {
  const [reports, setReports] = useState<AnalysisCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "similar">("similar");

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, filterType]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = "/api/analysis-cases";

      if (filterType === "similar" && selectedTarget) {
        // POST for similar cases
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: selectedTarget.customer,
            productModel: selectedTarget.productModel,
            defectType: selectedTarget.defectType,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const allCases = [
            ...(data.exactMatches || []),
            ...(data.partialMatches || []),
            ...(data.similarCases || []),
          ];
          setReports(allCases);
        }
      } else {
        // GET for all cases
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.caseNumber.toLowerCase().includes(query) ||
      report.customer.toLowerCase().includes(query) ||
      report.productModel.toLowerCase().includes(query) ||
      report.defectType.toLowerCase().includes(query) ||
      report.defectDescription.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CLOSED":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
            종료
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
            완료
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
            진행중
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
            대기
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[900px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                과거 보고서 수집
              </h2>
              <p className="text-sm text-gray-500">
                과거 분석 보고서를 조회하고 참고할 수 있습니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="보고서 검색 (케이스번호, 고객사, 제품, 결함유형...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setFilterType("similar")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === "similar"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                유사 사례
              </button>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === "all"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                전체 보기
              </button>
            </div>
          </div>

          {selectedTarget && filterType === "similar" && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>현재 분석 대상:</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                {selectedTarget.customer}
              </span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                {selectedTarget.productModel}
              </span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                {selectedTarget.defectType}
              </span>
            </div>
          )}
        </div>

        {/* Report List */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-gray-500">보고서 목록을 불러오는 중...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">조회된 보고서가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {report.caseNumber}
                        </span>
                        {getStatusBadge(report.status)}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.reportedAt)}
                        </span>
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {report.customer}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          {report.productModel}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          {report.defectType}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {report.defectDescription}
                      </p>

                      {/* Root Cause Preview */}
                      {report.rootCause && (
                        <p className="mt-2 text-xs text-gray-400">
                          <span className="font-medium text-gray-500">원인:</span>{" "}
                          {report.rootCause.slice(0, 80)}...
                        </p>
                      )}
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => onViewReport(report)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">보기</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            총 {filteredReports.length}건의 보고서
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
