"use client";

import { useState, useEffect } from "react";
import { Mail, Check, ArrowRight, Globe, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmailReceiveData {
  customer: string;
  productModel: string;
  lotId: string;
  cellId: string;
  defectType: string;
  defectDescription: string;
  emailContent: string;
}

interface EmailReceiveFlowProps {
  data: EmailReceiveData;
  onSaveToHistory?: (data: EmailReceiveData, translatedContent: string) => Promise<void>;
}

// 번역된 메일 내용 (목업)
const TRANSLATED_EMAIL_CONTENT = `제목: 품질 이슈 보고 - OLED 디스플레이 결함 [긴급]

품질보증팀 담당자님께,

최근 입고된 OLED 디스플레이에서 발견된 중요한 품질 이슈를 보고드립니다.

제품 정보:
- 제품 모델: OLED_67_FHD
- LOT ID: LOT20241203001
- Cell ID: CELL12345

결함 상세:
- 결함 유형: DEAD_PIXEL (데드픽셀)
- 설명: 화면 중앙부에 검은색 점 발견. 크기 약 0.3mm
- 심각도: 높음
- 발견일: 2024년 12월 3일

해당 이슈는 입고 품질 검사 과정에서 발견되었습니다. 영향을 받은 유닛은 중앙 시청 영역에 육안으로 보이는 데드픽셀이 있어 소비자 제품에 대한 품질 기준을 충족하지 못합니다.

다음 사항을 요청드립니다:
1. 해당 결함의 근본 원인 분석
2. 영향받은 LOT 범위 확인
3. 시정 조치 계획
4. 영향받은 유닛에 대한 교체 또는 크레딧 처리

생산 일정에 영향을 미치는 사안이므로 긴급하게 처리해 주시기 바랍니다.

감사합니다.
품질 엔지니어링 팀
Apple Inc.`;

type FlowStep = "receiving" | "original" | "translating" | "translated" | "ready";

export function EmailReceiveFlow({ data, onSaveToHistory }: EmailReceiveFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>("receiving");
  const [showOriginal, setShowOriginal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Simulate email receiving delay
    const timer1 = setTimeout(() => {
      setCurrentStep("original");
    }, 1500);

    return () => clearTimeout(timer1);
  }, []);

  const handleTranslate = () => {
    setCurrentStep("translating");
    // Simulate translation delay
    setTimeout(() => {
      setCurrentStep("translated");
      setShowOriginal(false);
    }, 2000);
  };

  const handleReady = () => {
    setCurrentStep("ready");
  };

  const handleOpenExternal = async () => {
    // 히스토리에 저장
    if (onSaveToHistory) {
      setIsSaving(true);
      try {
        await onSaveToHistory(data, TRANSLATED_EMAIL_CONTENT);
      } catch (error) {
        console.error("히스토리 저장 실패:", error);
      } finally {
        setIsSaving(false);
      }
    }

    // Open the external complaint registration system
    // URL with query parameters for pre-filling the form
    const params = new URLSearchParams({
      customer: data.customer,
      productModel: data.productModel,
      lotId: data.lotId,
      cellId: data.cellId,
      defectType: data.defectType,
      defectDescription: data.defectDescription,
    });
    window.open(`http://localhost:7860/?${params.toString()}`, "_blank");
  };

  const StepIndicator = ({ step, label, isActive, isComplete }: { step: number; label: string; isActive: boolean; isComplete: boolean }) => (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        isComplete ? "bg-green-500 text-white" :
        isActive ? "bg-blue-500 text-white" :
        "bg-gray-200 text-gray-500"
      }`}>
        {isComplete ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={`text-sm ${isActive || isComplete ? "text-gray-800 font-medium" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Flow Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6" />
          <h2 className="text-lg font-semibold">고객불량 분석요청 메일 수신</h2>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-6">
          <StepIndicator
            step={1}
            label="메일 수신"
            isActive={currentStep === "receiving" || currentStep === "original"}
            isComplete={currentStep !== "receiving"}
          />
          <ArrowRight className="w-4 h-4 text-blue-300" />
          <StepIndicator
            step={2}
            label="번역"
            isActive={currentStep === "translating" || currentStep === "translated"}
            isComplete={currentStep === "translated" || currentStep === "ready"}
          />
          <ArrowRight className="w-4 h-4 text-blue-300" />
          <StepIndicator
            step={3}
            label="접수 시스템 연계"
            isActive={currentStep === "ready"}
            isComplete={false}
          />
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Step 1: Receiving */}
        {currentStep === "receiving" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg text-gray-600">메일 내용 수신 확인 중...</p>
            <p className="text-sm text-gray-400 mt-2">잠시만 기다려주세요</p>
          </div>
        )}

        {/* Step 2: Original Email */}
        {(currentStep === "original" || currentStep === "translating" || currentStep === "translated" || currentStep === "ready") && (
          <div className="space-y-4">
            {/* Email Info Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                수신 메일 정보
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">고객사:</span>
                  <span className="ml-2 font-medium text-gray-800">{data.customer}</span>
                </div>
                <div>
                  <span className="text-gray-500">제품 모델:</span>
                  <span className="ml-2 font-medium text-gray-800">{data.productModel}</span>
                </div>
                <div>
                  <span className="text-gray-500">LOT ID:</span>
                  <span className="ml-2 font-medium text-gray-800">{data.lotId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cell ID:</span>
                  <span className="ml-2 font-medium text-gray-800">{data.cellId}</span>
                </div>
                <div>
                  <span className="text-gray-500">결함 유형:</span>
                  <span className="ml-2 font-medium text-red-600">{data.defectType}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="text-gray-500">결함 설명:</span>
                  <span className="ml-2 font-medium text-gray-800">{data.defectDescription}</span>
                </div>
              </div>
            </div>

            {/* Email Content Toggle */}
            {(currentStep === "translated" || currentStep === "ready") && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    showOriginal
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-1" />
                  원문 (English)
                </button>
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    !showOriginal
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  번역문 (Korean)
                </button>
              </div>
            )}

            {/* Email Content */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {showOriginal ? "Original Email (English)" : "번역된 메일 (Korean)"}
                </span>
                {currentStep === "translating" && (
                  <span className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    번역 중...
                  </span>
                )}
              </div>
              <div className="p-4 max-h-96 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {showOriginal ? data.emailContent : TRANSLATED_EMAIL_CONTENT}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep === "original" && (
                <Button
                  onClick={handleTranslate}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  메일 번역하기
                </Button>
              )}

              {currentStep === "translated" && (
                <Button
                  onClick={handleReady}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  번역 확인 완료
                </Button>
              )}

              {currentStep === "ready" && (
                <Button
                  onClick={handleOpenExternal}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  접수 시스템으로 연계 (CS 워크플로우)
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
