"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Truck,
  Factory,
  GitBranch,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  FileCode,
  Check,
  X,
  ChevronRight,
  Loader2,
  MessageSquare,
  Send,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Home,
} from "lucide-react";
import {
  ERP_SHIPMENT_DATA,
  MES_PRODUCTION_DATA,
  LOT_TRACKING_DATA,
  QUALITY_INSPECTION_DATA,
  DEFECT_HISTORY_DATA,
  PROCESS_EQUIPMENT_DATA,
  DEVELOPMENT_HISTORY_DATA,
  MATERIAL_DATA,
  type ERPShipmentData,
  type MESProductionData,
  type LotTrackingData,
  type QualityInspectionData,
  type DefectHistoryData,
  type ProcessEquipmentData,
  type DevelopmentHistoryData,
  type MaterialData,
  type AnalysisTarget as BaseAnalysisTarget,
} from "@/data/productionMockData";

// 분석 대상 인터페이스 (기본 타입 확장, optional 필드 허용)
export interface AnalysisTarget extends Omit<BaseAnalysisTarget, 'defectDescription' | 'registeredAt'> {
  defectDescription?: string;
  registeredAt?: string;
}

// 수집 단계 정의
type CollectionStep =
  | "init"
  | "erp_shipment"
  | "mes_production"
  | "lot_tracking"
  | "quality_inspection"
  | "defect_history"
  | "process_equipment"
  | "development_history"
  | "final_review"
  | "llm_analysis";

interface StepData {
  id: CollectionStep;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// 선택 가능한 제품 목록
const AVAILABLE_PRODUCTS = [
  { model: "OLED_67_FHD", name: "OLED 6.7인치 FHD" },
  { model: "AMOLED_55_4K", name: "AMOLED 5.5인치 4K" },
  { model: "OLED_77_8K", name: "OLED 7.7인치 8K" },
];

// 선택 가능한 LOT 목록 (실제로는 API에서 조회)
const AVAILABLE_LOTS = [
  "LOT20241203001",
  "LOT20241203002",
  "LOT20241203003",
  "LOT20241204001",
  "LOT20241204002",
  "LOT20241205001",
];

const COLLECTION_STEPS: StepData[] = [
  {
    id: "erp_shipment",
    label: "ERP 출하 정보",
    icon: <Truck className="w-5 h-5" />,
    description: "출하 LOT 정보를 ERP 시스템에서 조회합니다.",
  },
  {
    id: "mes_production",
    label: "MES 생산 실적",
    icon: <Factory className="w-5 h-5" />,
    description: "생산 실적 및 수율 정보를 조회합니다.",
  },
  {
    id: "lot_tracking",
    label: "LOT 트래킹",
    icon: <GitBranch className="w-5 h-5" />,
    description: "LOT별 공정 흐름을 추적합니다.",
  },
  {
    id: "quality_inspection",
    label: "품질 검사",
    icon: <ClipboardCheck className="w-5 h-5" />,
    description: "품질 검사 이력을 조회합니다.",
  },
  {
    id: "defect_history",
    label: "불량 이력",
    icon: <AlertTriangle className="w-5 h-5" />,
    description: "관련 불량 이력을 조회합니다.",
  },
  {
    id: "process_equipment",
    label: "공정/설비 이력",
    icon: <Settings className="w-5 h-5" />,
    description: "공정 파라미터 및 설비 이력을 조회합니다.",
  },
  {
    id: "development_history",
    label: "개발/자재 이력",
    icon: <FileCode className="w-5 h-5" />,
    description: "설계 변경 및 자재 정보를 조회합니다.",
  },
];

// 각 단계별 수집 데이터 상태
interface CollectedData {
  erp_shipment?: {
    data: ERPShipmentData | null;
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
  mes_production?: {
    data: MESProductionData[];
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
  lot_tracking?: {
    data: LotTrackingData | null;
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
  quality_inspection?: {
    data: QualityInspectionData[];
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
  defect_history?: {
    data: DefectHistoryData[];
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
  process_equipment?: {
    data: ProcessEquipmentData[];
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
  development_history?: {
    data: {
      development: DevelopmentHistoryData[];
      materials: MaterialData[];
    };
    confirmed: boolean;
    userComment?: string;
    skipped: boolean;
  };
}

interface DataCollectionFlowProps {
  analysisTarget: AnalysisTarget;
  onComplete: (context: string, collectedData: CollectedData) => void;
  onCancel: () => void;
  onRecollect?: (newTarget: AnalysisTarget) => void;
}

export function DataCollectionFlow({
  analysisTarget,
  onComplete,
  onCancel,
  onRecollect,
}: DataCollectionFlowProps) {
  const [currentStep, setCurrentStep] = useState<CollectionStep>("init");
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<CollectedData>({});
  const [userComment, setUserComment] = useState("");
  const [showDetails, setShowDetails] = useState(true);

  // 초기 LOT 편집 관련 상태
  const [showInitLotEdit, setShowInitLotEdit] = useState(false);
  const [initLotIds, setInitLotIds] = useState<string[]>([analysisTarget.lotId]);
  const [initLotInput, setInitLotInput] = useState("");

  // 수집 단계 활성화/비활성화 상태
  const [enabledSteps, setEnabledSteps] = useState<Record<CollectionStep, boolean>>({
    init: true,
    erp_shipment: true,
    mes_production: true,
    lot_tracking: true,
    quality_inspection: true,
    defect_history: true,
    process_equipment: true,
    development_history: true,
    final_review: true,
    llm_analysis: true,
  });

  // 데이터 재수집 관련 상태
  const [showRecollectForm, setShowRecollectForm] = useState(false);
  const [recollectProductModel, setRecollectProductModel] = useState(analysisTarget.productModel);
  const [recollectLotIds, setRecollectLotIds] = useState<string[]>([analysisTarget.lotId]);
  const [newLotInput, setNewLotInput] = useState("");

  // 현재 단계 인덱스
  const currentStepIndex = COLLECTION_STEPS.findIndex((s) => s.id === currentStep);

  // 데이터 조회 시뮬레이션
  const fetchStepData = useCallback(async (step: CollectionStep) => {
    setIsLoading(true);
    // 실제 API 호출 시뮬레이션 (1-2초 딜레이)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    let data: CollectedData[keyof CollectedData] | undefined;

    switch (step) {
      case "erp_shipment":
        const shipment = ERP_SHIPMENT_DATA.find(
          (s) => s.shipmentLotId === analysisTarget.lotId
        );
        data = { data: shipment || null, confirmed: false, skipped: false };
        break;

      case "mes_production":
        const production = MES_PRODUCTION_DATA.filter(
          (p) => p.productModel === analysisTarget.productModel
        );
        data = { data: production, confirmed: false, skipped: false };
        break;

      case "lot_tracking":
        data = { data: LOT_TRACKING_DATA, confirmed: false, skipped: false };
        break;

      case "quality_inspection":
        data = { data: QUALITY_INSPECTION_DATA, confirmed: false, skipped: false };
        break;

      case "defect_history":
        const defects = DEFECT_HISTORY_DATA.filter(
          (d) => d.cellId === analysisTarget.cellId || d.defectType === analysisTarget.defectType
        );
        data = { data: defects, confirmed: false, skipped: false };
        break;

      case "process_equipment":
        data = { data: PROCESS_EQUIPMENT_DATA, confirmed: false, skipped: false };
        break;

      case "development_history":
        const development = DEVELOPMENT_HISTORY_DATA.filter(
          (d) => d.productModel === analysisTarget.productModel
        );
        data = {
          data: { development, materials: MATERIAL_DATA },
          confirmed: false,
          skipped: false,
        };
        break;
    }

    setCollectedData((prev) => ({ ...prev, [step]: data }));
    setIsLoading(false);
  }, [analysisTarget]);

  // 단계 활성화 토글
  const toggleStep = (stepId: CollectionStep) => {
    setEnabledSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // 다음 활성화된 단계 찾기
  const findNextEnabledStep = (fromIndex: number): CollectionStep | "final_review" => {
    for (let i = fromIndex; i < COLLECTION_STEPS.length; i++) {
      if (enabledSteps[COLLECTION_STEPS[i].id]) {
        return COLLECTION_STEPS[i].id;
      }
    }
    return "final_review";
  };

  // 단계 시작
  const startCollection = () => {
    const firstEnabledStep = findNextEnabledStep(0);
    if (firstEnabledStep === "final_review") {
      // 모든 단계가 비활성화된 경우
      setCurrentStep("final_review");
    } else {
      setCurrentStep(firstEnabledStep);
      fetchStepData(firstEnabledStep);
    }
  };

  // 다음 단계로
  const confirmAndNext = () => {
    if (!currentStep || currentStep === "init") return;

    // 현재 단계 확인
    setCollectedData((prev) => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep as keyof CollectedData],
        confirmed: true,
        userComment: userComment || undefined,
      },
    }));
    setUserComment("");

    // 다음 활성화된 단계 결정
    const nextIndex = currentStepIndex + 1;
    const nextStep = findNextEnabledStep(nextIndex);
    if (nextStep !== "final_review") {
      setCurrentStep(nextStep);
      fetchStepData(nextStep);
    } else {
      setCurrentStep("final_review");
    }
  };

  // 스킵
  const skipStep = () => {
    if (!currentStep || currentStep === "init") return;

    setCollectedData((prev) => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep as keyof CollectedData],
        skipped: true,
      },
    }));
    setUserComment("");

    // 다음 활성화된 단계로 이동
    const nextIndex = currentStepIndex + 1;
    const nextStep = findNextEnabledStep(nextIndex);
    if (nextStep !== "final_review") {
      setCurrentStep(nextStep);
      fetchStepData(nextStep);
    } else {
      setCurrentStep("final_review");
    }
  };

  // LOT 추가
  const addLotId = () => {
    const trimmedLot = newLotInput.trim();
    if (trimmedLot && !recollectLotIds.includes(trimmedLot)) {
      setRecollectLotIds([...recollectLotIds, trimmedLot]);
      setNewLotInput("");
    }
  };

  // LOT 삭제 (재수집용)
  const removeLotId = (lotId: string) => {
    if (recollectLotIds.length > 1) {
      setRecollectLotIds(recollectLotIds.filter((l) => l !== lotId));
    }
  };

  // 초기 LOT 추가
  const addInitLotId = () => {
    const trimmedLot = initLotInput.trim();
    if (trimmedLot && !initLotIds.includes(trimmedLot)) {
      setInitLotIds([...initLotIds, trimmedLot]);
      setInitLotInput("");
    }
  };

  // 초기 LOT 삭제
  const removeInitLotId = (lotId: string) => {
    if (initLotIds.length > 1) {
      setInitLotIds(initLotIds.filter((l) => l !== lotId));
    }
  };

  // 데이터 재수집 시작
  const startRecollect = () => {
    if (recollectLotIds.length === 0) return;

    const newTarget: AnalysisTarget = {
      ...analysisTarget,
      productModel: recollectProductModel,
      lotId: recollectLotIds[0], // 첫 번째 LOT을 주 LOT으로 사용
    };

    // 상태 초기화
    setCollectedData({});
    setCurrentStep("init");
    setShowRecollectForm(false);

    // 부모에게 새로운 분석 대상 전달
    if (onRecollect) {
      onRecollect(newTarget);
    }
  };

  // 최종 컨텍스트 생성
  const generateFinalContext = (): string => {
    let context = `# 품질 불량 분석을 위한 데이터 수집 결과\n\n`;
    context += `## 분석 대상 정보\n`;
    context += `- 접수 ID: ${analysisTarget.id}\n`;
    context += `- 고객사: ${analysisTarget.customer}\n`;
    context += `- 제품 모델: ${analysisTarget.productModel}\n`;
    context += `- LOT ID: ${analysisTarget.lotId}\n`;
    context += `- Cell ID: ${analysisTarget.cellId}\n`;
    context += `- 불량 유형: ${analysisTarget.defectType}\n`;
    context += `- 불량 설명: ${analysisTarget.defectDescription || 'N/A'}\n\n`;

    // ERP 출하 정보
    if (collectedData.erp_shipment && !collectedData.erp_shipment.skipped) {
      const shipment = collectedData.erp_shipment.data;
      context += `## ERP 출하 정보\n`;
      if (shipment) {
        context += `- 출하 ID: ${shipment.shipmentId}\n`;
        context += `- 출하일: ${shipment.shipmentDate}\n`;
        context += `- 수량: ${shipment.quantity}개\n`;
        context += `- 배송지: ${shipment.destination}\n`;
        context += `- Invoice: ${shipment.invoiceNo}\n`;
      } else {
        context += `- 해당 LOT의 출하 정보를 찾을 수 없습니다.\n`;
      }
      if (collectedData.erp_shipment.userComment) {
        context += `- [사용자 코멘트] ${collectedData.erp_shipment.userComment}\n`;
      }
      context += `\n`;
    }

    // MES 생산 실적
    if (collectedData.mes_production && !collectedData.mes_production.skipped) {
      context += `## MES 생산 실적\n`;
      collectedData.mes_production.data.forEach((p) => {
        context += `### ${p.productionDate} 생산\n`;
        context += `- LOT: ${p.productionLotId}\n`;
        context += `- 라인: ${p.lineName}\n`;
        context += `- 수율: ${p.yieldRate}% (양품 ${p.goodQty}/불량 ${p.defectQty})\n`;
        context += `- 작업자: ${p.operator}\n`;
      });
      if (collectedData.mes_production.userComment) {
        context += `- [사용자 코멘트] ${collectedData.mes_production.userComment}\n`;
      }
      context += `\n`;
    }

    // LOT 트래킹
    if (collectedData.lot_tracking && !collectedData.lot_tracking.skipped) {
      const lot = collectedData.lot_tracking.data;
      context += `## LOT 트래킹\n`;
      if (lot) {
        context += `- 출하 LOT: ${lot.shipmentLotId}\n`;
        context += `- 생산 LOT: ${lot.productionLotId}\n`;
        context += `- 검사 LOT: ${lot.inspectionLotId}\n`;
        context += `- 투입 자재: ${lot.materialLotIds.join(', ')}\n\n`;
        context += `### 공정 흐름\n`;
        lot.processFlow.forEach((step) => {
          context += `${step.stepNo}. ${step.processName}: ${step.result} (${step.equipmentName}, ${step.operator})\n`;
        });
      }
      if (collectedData.lot_tracking.userComment) {
        context += `- [사용자 코멘트] ${collectedData.lot_tracking.userComment}\n`;
      }
      context += `\n`;
    }

    // 품질 검사
    if (collectedData.quality_inspection && !collectedData.quality_inspection.skipped) {
      context += `## 품질 검사 이력\n`;
      collectedData.quality_inspection.data.forEach((qi) => {
        context += `### ${qi.inspectionType} (${qi.inspectionDate})\n`;
        context += `- 결과: ${qi.result} (합격 ${qi.passQty}/불합격 ${qi.failQty})\n`;
        qi.inspectionItems.forEach((item) => {
          context += `  - ${item.itemName}: ${item.result}`;
          if (item.remarks) context += ` (${item.remarks})`;
          context += `\n`;
        });
      });
      if (collectedData.quality_inspection.userComment) {
        context += `- [사용자 코멘트] ${collectedData.quality_inspection.userComment}\n`;
      }
      context += `\n`;
    }

    // 불량 이력
    if (collectedData.defect_history && !collectedData.defect_history.skipped) {
      context += `## 불량 이력\n`;
      collectedData.defect_history.data.forEach((def) => {
        context += `### ${def.defectId}\n`;
        context += `- 유형: ${def.defectType}\n`;
        context += `- Cell: ${def.cellId}\n`;
        context += `- 위치: ${def.defectLocation}\n`;
        context += `- 심각도: ${def.severity}\n`;
        context += `- 원인: ${def.rootCause || '분석 중'}\n`;
        context += `- 상태: ${def.status}\n`;
      });
      if (collectedData.defect_history.userComment) {
        context += `- [사용자 코멘트] ${collectedData.defect_history.userComment}\n`;
      }
      context += `\n`;
    }

    // 공정/설비
    if (collectedData.process_equipment && !collectedData.process_equipment.skipped) {
      context += `## 공정/설비 이력\n`;
      collectedData.process_equipment.data.forEach((eq) => {
        context += `### ${eq.equipmentName}\n`;
        context += `- 가동시간: ${eq.runningTime}분\n`;
        context += `- 유지보수:\n`;
        eq.maintenanceHistory.forEach((mh) => {
          context += `  - ${mh.maintenanceDate}: ${mh.description}\n`;
        });
      });
      if (collectedData.process_equipment.userComment) {
        context += `- [사용자 코멘트] ${collectedData.process_equipment.userComment}\n`;
      }
      context += `\n`;
    }

    // 개발/자재
    if (collectedData.development_history && !collectedData.development_history.skipped) {
      context += `## 개발 이력\n`;
      collectedData.development_history.data.development.forEach((dev) => {
        context += `### v${dev.version} - ${dev.changeType}\n`;
        context += `- ${dev.description}\n`;
      });
      context += `\n## 투입 자재\n`;
      collectedData.development_history.data.materials.forEach((mat) => {
        context += `- ${mat.materialName} (${mat.materialLotId}): ${mat.supplier}\n`;
      });
      if (collectedData.development_history.userComment) {
        context += `- [사용자 코멘트] ${collectedData.development_history.userComment}\n`;
      }
      context += `\n`;
    }

    return context;
  };

  // 분석 시작
  const startAnalysis = () => {
    const context = generateFinalContext();
    onComplete(context, collectedData);
  };

  // 단계별 데이터 렌더링
  const renderStepData = () => {
    switch (currentStep) {
      case "erp_shipment":
        return renderERPShipmentData();
      case "mes_production":
        return renderMESProductionData();
      case "lot_tracking":
        return renderLotTrackingData();
      case "quality_inspection":
        return renderQualityInspectionData();
      case "defect_history":
        return renderDefectHistoryData();
      case "process_equipment":
        return renderProcessEquipmentData();
      case "development_history":
        return renderDevelopmentHistoryData();
      default:
        return null;
    }
  };

  const renderERPShipmentData = () => {
    const data = collectedData.erp_shipment?.data;
    if (!data) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-yellow-700">해당 LOT ({analysisTarget.lotId})의 출하 정보를 찾을 수 없습니다.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500">출하 ID</span>
            <p className="font-medium">{data.shipmentId}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500">출하일</span>
            <p className="font-medium">{data.shipmentDate}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500">수량</span>
            <p className="font-medium">{data.quantity.toLocaleString()}개</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500">상태</span>
            <p className="font-medium">{data.status}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500">배송지</span>
          <p className="font-medium">{data.destination}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500">Invoice No</span>
            <p className="font-medium text-sm">{data.invoiceNo}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-500">PO Number</span>
            <p className="font-medium text-sm">{data.poNumber}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderMESProductionData = () => {
    const data = collectedData.mes_production?.data;
    if (!data || data.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-yellow-700">생산 실적 데이터를 찾을 수 없습니다.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {data.map((p) => (
          <div key={p.productionId} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{p.productionDate}</span>
              <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">{p.productionLotId}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500">라인</span>
                <p className="font-medium">{p.lineName}</p>
              </div>
              <div>
                <span className="text-gray-500">수율</span>
                <p className="font-medium text-green-600">{p.yieldRate}%</p>
              </div>
              <div>
                <span className="text-gray-500">양품/불량</span>
                <p className="font-medium">{p.goodQty}/{p.defectQty}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              작업자: {p.operator} | 감독: {p.supervisor}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLotTrackingData = () => {
    const data = collectedData.lot_tracking?.data;
    if (!data) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-blue-50 rounded-lg p-3">
            <span className="text-xs text-blue-600">출하 LOT</span>
            <p className="font-medium">{data.shipmentLotId}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <span className="text-xs text-green-600">생산 LOT</span>
            <p className="font-medium">{data.productionLotId}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <span className="text-xs text-purple-600">검사 LOT</span>
            <p className="font-medium">{data.inspectionLotId}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-3">공정 흐름</h4>
          <div className="space-y-2">
            {data.processFlow.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {step.stepNo}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.processName}</p>
                  <p className="text-xs text-gray-500">{step.equipmentName} | {step.operator}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  step.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {step.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderQualityInspectionData = () => {
    const data = collectedData.quality_inspection?.data;
    if (!data || data.length === 0) return null;

    return (
      <div className="space-y-4">
        {data.map((qi) => (
          <div key={qi.inspectionId} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium">{qi.inspectionType}</span>
                <span className="text-sm text-gray-500 ml-2">{qi.inspectionDate}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                qi.result === 'PASS' ? 'bg-green-100 text-green-700' :
                qi.result === 'FAIL' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {qi.result}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              검사자: {qi.inspectorName} | 샘플: {qi.sampleSize}개 (합격 {qi.passQty}/불합격 {qi.failQty})
            </div>
            <div className="space-y-2">
              {qi.inspectionItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>{item.itemName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{item.measuredValue}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      item.result === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDefectHistoryData = () => {
    const data = collectedData.defect_history?.data;
    if (!data || data.length === 0) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-700">관련 불량 이력이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((def) => (
          <div key={def.defectId} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{def.defectId}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                def.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                def.severity === 'Major' ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {def.severity}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">불량 유형</span>
                <p className="font-medium text-red-600">{def.defectType}</p>
              </div>
              <div>
                <span className="text-gray-500">Cell ID</span>
                <p className="font-medium">{def.cellId}</p>
              </div>
              <div>
                <span className="text-gray-500">위치</span>
                <p className="font-medium">{def.defectLocation}</p>
              </div>
              <div>
                <span className="text-gray-500">상태</span>
                <p className="font-medium">{def.status}</p>
              </div>
            </div>
            {def.rootCause && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">원인: </span>
                <span>{def.rootCause}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProcessEquipmentData = () => {
    const data = collectedData.process_equipment?.data;
    if (!data || data.length === 0) return null;

    return (
      <div className="space-y-4">
        {data.map((eq) => (
          <div key={eq.equipmentId} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{eq.equipmentName}</span>
              <span className="text-xs text-gray-500">{eq.equipmentId}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm mb-3">
              <div className="bg-green-50 rounded p-2 text-center">
                <p className="text-green-600 font-medium">{eq.runningTime}분</p>
                <span className="text-xs text-gray-500">가동</span>
              </div>
              <div className="bg-yellow-50 rounded p-2 text-center">
                <p className="text-yellow-600 font-medium">{eq.idleTime}분</p>
                <span className="text-xs text-gray-500">유휴</span>
              </div>
              <div className="bg-red-50 rounded p-2 text-center">
                <p className="text-red-600 font-medium">{eq.downTime}분</p>
                <span className="text-xs text-gray-500">정지</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 mb-1">유지보수 이력:</p>
              {eq.maintenanceHistory.map((mh) => (
                <div key={mh.maintenanceId} className="text-xs bg-white rounded p-2 mb-1">
                  <span className="font-medium">{mh.maintenanceDate}</span>
                  <span className="text-gray-400 mx-1">|</span>
                  <span>{mh.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDevelopmentHistoryData = () => {
    const data = collectedData.development_history?.data;
    if (!data) return null;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">개발 이력</h4>
          <div className="space-y-2">
            {data.development.map((dev) => (
              <div key={dev.developmentId} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">v{dev.version}</span>
                  <span className="text-xs text-gray-500">{dev.developmentDate}</span>
                </div>
                <p className="text-sm text-gray-600">{dev.description}</p>
                <p className="text-xs text-gray-400 mt-1">담당: {dev.engineer}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">투입 자재</h4>
          <div className="space-y-2">
            {data.materials.map((mat) => (
              <div key={mat.materialId} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{mat.materialName}</p>
                  <p className="text-xs text-gray-500">{mat.materialLotId}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{mat.supplier}</p>
                  <p className={`text-xs ${
                    mat.inspectionResult === 'PASS' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mat.inspectionResult}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 최종 리뷰 화면
  const renderFinalReview = () => {
    const confirmedSteps = COLLECTION_STEPS.filter(
      (step) => collectedData[step.id as keyof CollectedData]?.confirmed
    );
    const skippedSteps = COLLECTION_STEPS.filter(
      (step) => collectedData[step.id as keyof CollectedData]?.skipped
    );

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">데이터 수집 완료</h3>
          <p className="text-sm text-blue-600">
            수집된 데이터를 기반으로 LLM 분석을 시작할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              수집 완료 ({confirmedSteps.length})
            </h4>
            <ul className="text-sm text-green-600 space-y-1">
              {confirmedSteps.map((step) => (
                <li key={step.id}>- {step.label}</li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <X className="w-4 h-4" />
              스킵됨 ({skippedSteps.length})
            </h4>
            <ul className="text-sm text-gray-500 space-y-1">
              {skippedSteps.map((step) => (
                <li key={step.id}>- {step.label}</li>
              ))}
              {skippedSteps.length === 0 && <li>없음</li>}
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">사용자 코멘트</h4>
          <div className="space-y-2 text-sm">
            {COLLECTION_STEPS.map((step) => {
              const stepData = collectedData[step.id as keyof CollectedData];
              if (stepData?.userComment) {
                return (
                  <div key={step.id} className="bg-white rounded p-2">
                    <span className="text-gray-500">{step.label}:</span>
                    <span className="ml-2">{stepData.userComment}</span>
                  </div>
                );
              }
              return null;
            })}
            {!COLLECTION_STEPS.some(
              (step) => collectedData[step.id as keyof CollectedData]?.userComment
            ) && <p className="text-gray-400">추가된 코멘트가 없습니다.</p>}
          </div>
        </div>
      </div>
    );
  };

  // 초기 화면
  if (currentStep === "init") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6" />
            <h2 className="text-lg font-semibold">데이터 수집 플로우</h2>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            단계별로 데이터를 수집하고 확인합니다.
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">분석 대상</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">고객사:</span>
                <span className="ml-2 font-medium">{analysisTarget.customer}</span>
              </div>
              <div>
                <span className="text-gray-500">제품:</span>
                <span className="ml-2 font-medium">{analysisTarget.productModel}</span>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500">LOT ID:</span>
                    <span className="ml-2 font-medium">{initLotIds.join(", ")}</span>
                    {initLotIds.length > 1 && (
                      <span className="ml-1 text-xs text-blue-600">({initLotIds.length}개)</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowInitLotEdit(!showInitLotEdit)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    {showInitLotEdit ? "닫기" : "LOT 변경"}
                  </button>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Cell ID:</span>
                <span className="ml-2 font-medium">{analysisTarget.cellId}</span>
              </div>
              <div>
                <span className="text-gray-500">불량 유형:</span>
                <span className="ml-2 font-medium text-red-600">{analysisTarget.defectType}</span>
              </div>
            </div>

            {/* LOT 편집 패널 */}
            {showInitLotEdit && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  LOT 추적 대상 설정 (복수 선택 가능)
                </h4>

                {/* LOT 선택 드롭다운 */}
                <div className="flex gap-2 mb-2">
                  <select
                    value={initLotInput}
                    onChange={(e) => setInitLotInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">LOT 선택...</option>
                    {AVAILABLE_LOTS.filter((lot) => !initLotIds.includes(lot)).map((lot) => (
                      <option key={lot} value={lot}>
                        {lot}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addInitLotId}
                    disabled={!initLotInput}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    추가
                  </button>
                </div>

                {/* 직접 입력 */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={initLotInput}
                    onChange={(e) => setInitLotInput(e.target.value)}
                    placeholder="LOT ID 직접 입력..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInitLotId();
                      }
                    }}
                  />
                </div>

                {/* 선택된 LOT 목록 */}
                <div className="flex flex-wrap gap-2">
                  {initLotIds.map((lot, idx) => (
                    <span
                      key={lot}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        idx === 0
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {idx === 0 && <span className="text-xs">(주)</span>}
                      {lot}
                      {initLotIds.length > 1 && (
                        <button
                          onClick={() => removeInitLotId(lot)}
                          className={`hover:opacity-70 ${idx === 0 ? "text-white" : "text-blue-600"}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * 첫 번째 LOT이 주 LOT으로 사용됩니다. 여러 LOT을 추가하면 함께 추적됩니다.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">수집 단계</h3>
            <p className="text-xs text-gray-500">체크 해제 시 해당 단계 스킵</p>
          </div>
          <div className="space-y-2">
            {COLLECTION_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  enabledSteps[step.id]
                    ? "bg-gray-50 hover:bg-gray-100"
                    : "bg-gray-100 opacity-60"
                }`}
                onClick={() => toggleStep(step.id)}
              >
                <input
                  type="checkbox"
                  checked={enabledSteps[step.id]}
                  onChange={() => toggleStep(step.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  enabledSteps[step.id] ? "bg-gray-200 text-gray-500" : "bg-gray-300 text-gray-400"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${!enabledSteps[step.id] && "line-through text-gray-400"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                <div className={enabledSteps[step.id] ? "text-gray-400" : "text-gray-300"}>
                  {step.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={startCollection}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            데이터 수집 시작
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 최종 리뷰 화면
  if (currentStep === "final_review") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6" />
            <h2 className="text-lg font-semibold">최종 확인</h2>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {renderFinalReview()}

          {/* 데이터 재수집 폼 */}
          {showRecollectForm && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                데이터 재수집 설정
              </h3>

              {/* 제품 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제품 모델
                </label>
                <select
                  value={recollectProductModel}
                  onChange={(e) => setRecollectProductModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {AVAILABLE_PRODUCTS.map((product) => (
                    <option key={product.model} value={product.model}>
                      {product.model} ({product.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* LOT ID 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LOT ID (복수 선택 가능)
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={newLotInput}
                    onChange={(e) => setNewLotInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">LOT 선택...</option>
                    {AVAILABLE_LOTS.filter((lot) => !recollectLotIds.includes(lot)).map((lot) => (
                      <option key={lot} value={lot}>
                        {lot}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addLotId}
                    disabled={!newLotInput}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>

                {/* 직접 입력 */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLotInput}
                    onChange={(e) => setNewLotInput(e.target.value)}
                    placeholder="또는 LOT ID 직접 입력..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLotId();
                      }
                    }}
                  />
                </div>

                {/* 선택된 LOT 목록 */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {recollectLotIds.map((lot) => (
                    <span
                      key={lot}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {lot}
                      {recollectLotIds.length > 1 && (
                        <button
                          onClick={() => removeLotId(lot)}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* 재수집 시작 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRecollectForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={startRecollect}
                  disabled={recollectLotIds.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  재수집 시작
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => setShowRecollectForm(true)}
            disabled={showRecollectForm}
            className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            데이터 재수집
          </button>
          <button
            onClick={startAnalysis}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            기본 분석 시작
          </button>
        </div>
      </div>
    );
  }

  // 데이터 수집 단계 화면
  const currentStepData = COLLECTION_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* 헤더 - 진행 상황 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {currentStepData?.icon}
            <h2 className="text-lg font-semibold">{currentStepData?.label}</h2>
          </div>
          <span className="text-blue-200 text-sm">
            {currentStepIndex + 1} / {COLLECTION_STEPS.length}
          </span>
        </div>
        <p className="text-blue-100 text-sm">{currentStepData?.description}</p>

        {/* 프로그레스 바 */}
        <div className="mt-3 flex gap-1">
          {COLLECTION_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full ${
                idx < currentStepIndex
                  ? "bg-green-400"
                  : idx === currentStepIndex
                  ? "bg-white"
                  : "bg-blue-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 데이터 영역 */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">데이터 조회 중...</p>
            <p className="text-sm text-gray-400 mt-1">{currentStepData?.label}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">조회 결과</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-500 flex items-center gap-1"
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDetails ? "간략히" : "상세히"}
              </button>
            </div>

            {showDetails && renderStepData()}

            {/* 사용자 코멘트 입력 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                코멘트 추가 (선택사항)
              </label>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="이 데이터에 대한 추가 의견이나 특이사항을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                rows={2}
              />
            </div>
          </>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="border-t border-gray-200 p-4 flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          title="처음 화면으로 이동"
        >
          <Home className="w-4 h-4" />
          처음으로
        </button>
        <button
          onClick={skipStep}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          스킵
        </button>
        <button
          onClick={() => fetchStepData(currentStep)}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          재조회
        </button>
        <button
          onClick={confirmAndNext}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          확인 및 다음
        </button>
      </div>
    </div>
  );
}
