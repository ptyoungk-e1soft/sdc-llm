"use client";

import { useState, useCallback, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import { useModelStore } from "@/stores/modelStore";
import {
  AlertCircle,
  Database,
  Search,
  BarChart3,
  FileText,
  History,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Building2,
  Package,
  Hash,
  AlertTriangle,
  ArrowLeft,
  Send,
} from "lucide-react";
import { DataCollectionSidebar } from "@/components/chat/DataCollectionSidebar";
import { DataCollectionFlow, type AnalysisTarget as BaseAnalysisTarget } from "@/components/chat/DataCollectionFlow";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { AnalysisActionSidebar, type AnalysisStage } from "@/components/chat/AnalysisActionSidebar";
import { ReportListModal } from "@/components/chat/ReportListModal";
import { ReportViewer } from "@/components/chat/ReportViewer";
import { useViewModeStore } from "@/stores/viewModeStore";
import {
  getCustomerContactPrompt,
  getQualityReviewPrompt,
  getEmailDraftPrompt,
  getApprovalRequestPrompt,
} from "@/data/productionMockData";

// 메시지 인터페이스
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// 접수 완료된 분석 대상 (DataCollectionFlow 타입 + status 필드)
interface AnalysisTarget extends BaseAnalysisTarget {
  defectDescription: string;
  registeredAt: string;
  status: "pending" | "in_progress" | "completed";
}

const REGISTERED_TARGETS: AnalysisTarget[] = [
  {
    id: "REG-2024-001",
    customer: "삼성전자",
    productModel: "OLED_67_FHD",
    lotId: "LOT20241203001",
    cellId: "CELL12345",
    defectType: "DEAD_PIXEL",
    defectDescription: "화면 중앙부에 검은색 점 발견. 크기 약 0.3mm",
    registeredAt: "2024-12-03",
    status: "in_progress",
  },
  {
    id: "REG-2024-002",
    customer: "LG전자",
    productModel: "AMOLED_55_4K",
    lotId: "LOT20241201002",
    cellId: "CELL67890",
    defectType: "LINE_DEFECT",
    defectDescription: "수직 라인 결함 발생. 화면 좌측 10% 위치",
    registeredAt: "2024-12-01",
    status: "pending",
  },
  {
    id: "REG-2024-003",
    customer: "현대모비스",
    productModel: "OLED_77_8K",
    lotId: "LOT20241128003",
    cellId: "CELL11223",
    defectType: "MURA",
    defectDescription: "화면 얼룩 현상. 전체 화면에 불균일한 밝기 분포",
    registeredAt: "2024-11-28",
    status: "pending",
  },
];

interface CardItem {
  label: string;
  message?: string;
  action?: string;
  description?: string;
}

interface CardData {
  id: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  items: CardItem[];
}

const CARD_DATA: CardData[] = [
  {
    id: 1,
    title: "고객불량 확인",
    icon: <AlertCircle className="w-6 h-6" />,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100 border-red-200",
    items: [
      { label: "고객불량 분석요청 메일 수신/접수", action: "email_receive" },
      { label: "고객불량 분석요청 메일 진척현황", message: "고객불량 분석요청 메일 처리 진척현황을 알려주세요." },
    ],
  },
  {
    id: 2,
    title: "데이터 수집",
    icon: <Database className="w-6 h-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    items: [
      {
        label: "데이터 수집",
        action: "data_collection",
        description: "생산 실적 이력, 품질검사/불량이력, 공정/설비이력, 개발 이력, 변경점 이력을 조회할 수 있습니다."
      },
    ],
  },
  {
    id: 3,
    title: "기본 분석",
    icon: <Search className="w-6 h-6" />,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100 border-green-200",
    items: [
      { label: "1차 분석", message: "1차 분석을 수행해주세요." },
      { label: "고객 담당자", message: "고객 담당자 정보를 확인해주세요." },
      { label: "품질담당자", message: "품질담당자 정보를 조회해주세요." },
      { label: "귀책부서", message: "귀책부서를 분석해주세요." },
    ],
  },
  {
    id: 4,
    title: "상세 분석",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    items: [
      { label: "현장 데이터", message: "현장 데이터를 분석해주세요." },
      { label: "집계 데이터 분석", message: "집계 데이터를 분석해주세요." },
    ],
  },
  {
    id: 5,
    title: "보고서 작성",
    icon: <FileText className="w-6 h-6" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    items: [
      { label: "과거 보고서 수집", action: "past_reports", description: "과거 분석 보고서를 조회합니다." },
      { label: "2차분석 결과 집계", message: "2차분석 결과를 집계해주세요." },
      { label: "분석서 작성", message: "분석서를 작성해주세요." },
      { label: "내부 결재", message: "내부 결재 현황을 확인해주세요." },
      { label: "최종확정", message: "최종확정 처리를 진행해주세요." },
    ],
  },
  {
    id: 6,
    title: "과거 이력확인",
    icon: <History className="w-6 h-6" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
    items: [
      { label: "유사 사례 조회", action: "similar_cases", description: "현재 분석 대상과 유사한 과거 사례를 조회합니다." },
      { label: "이력 데이터 연계", message: "이력 데이터를 연계해주세요." },
      { label: "보고서 연계", message: "관련 보고서를 연계해주세요." },
    ],
  },
];

// 목업 메일 데이터
const MOCK_EMAIL_DATA = {
  customer: "Apple",
  productModel: "OLED_67_FHD",
  lotId: "LOT20241203001",
  cellId: "CELL12345",
  defectType: "DEAD_PIXEL",
  defectDescription: "Black spot found in center of screen. Size approximately 0.3mm",
  emailContent: `Subject: Quality Issue Report - OLED Display Defect [URGENT]

Dear Quality Assurance Team,

We are writing to report a critical quality issue identified in our recent shipment of OLED displays.

Product Information:
- Product Model: OLED_67_FHD
- LOT ID: LOT20241203001
- Cell ID: CELL12345

Defect Details:
- Defect Type: DEAD_PIXEL
- Description: Black spot found in center of screen. Size approximately 0.3mm
- Severity: High
- Detection Date: December 3, 2024

This issue was discovered during our incoming quality inspection process. The affected unit exhibits a visible dead pixel in the central viewing area, which does not meet our quality standards for consumer products.

We kindly request:
1. Root cause analysis of this defect
2. Confirmation of affected lot scope
3. Corrective action plan
4. Replacement or credit for affected units

Please treat this matter with urgency as it affects our production schedule.

Best regards,
Quality Engineering Team
Apple Inc.`,
};

type ViewMode = "cards" | "data_collection" | "chat";

export default function ChatPage() {
  const router = useRouter();
  const { createChat, createGroup, groups, fetchGroups, fetchChats, moveChatToGroup } = useChatStore();
  const { selectedModel } = useModelStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<AnalysisTarget | null>(REGISTERED_TARGETS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const { resetTrigger } = useViewModeStore();

  // 헤더에서 로고 클릭 시 첫 화면으로 리셋
  useEffect(() => {
    if (resetTrigger > 0) {
      setViewMode("cards");
      setMessages([]);
      setSelectedMenuId(undefined);
      setCollectedContext("");
    }
  }, [resetTrigger]);

  // 채팅 상태
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>();
  const [collectedContext, setCollectedContext] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 기본분석 단계 상태
  const [currentAnalysisStage, setCurrentAnalysisStage] = useState<AnalysisStage>("primary_analysis");
  const [completedAnalysisStages, setCompletedAnalysisStages] = useState<AnalysisStage[]>(["data_review"]);
  const [analysisActionSidebarOpen, setAnalysisActionSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 과거 보고서 모달 상태
  const [reportListOpen, setReportListOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{
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
  } | null>(null);

  // 메시지 영역 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 채팅 메시지 전송
  const sendMessage = useCallback(async (content: string, systemContext?: string) => {
    if (!content.trim() || isChatLoading) return;

    setIsChatLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content,
    };

    setMessages((prev) => [...prev, userMessage]);

    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    try {
      // 시스템 컨텍스트가 있으면 첫 번째 메시지로 추가
      const contextToUse = systemContext || collectedContext;
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 컨텍스트가 있으면 시스템 메시지로 추가
      if (contextToUse && messages.length === 0) {
        apiMessages.unshift({
          role: "user" as const,
          content: `[시스템 컨텍스트 - 수집된 데이터]\n${contextToUse}\n\n위 데이터를 기반으로 분석을 수행해주세요. 사용자의 질문에 위 데이터를 참고하여 답변해주세요.`,
        });
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const content = JSON.parse(line.slice(2));
              assistantContent += content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsChatLoading(false);
    }
  }, [isChatLoading, messages, selectedModel, collectedContext]);

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    const messageContent = input.trim();
    setInput("");
    sendMessage(messageContent);
  };

  const handleSidebarMenuSelect = (message: string) => {
    const menuMap: Record<string, string> = {
      "생산 실적 이력을 확인해주세요.": "production",
      "품질검사 및 불량이력을 조회해주세요.": "quality",
      "공정 및 설비 이력을 확인해주세요.": "process",
      "개발 이력 데이터를 조회해주세요.": "development",
      "변경점 이력을 확인해주세요.": "changes",
    };
    setSelectedMenuId(menuMap[message]);
    sendMessage(message);
  };

  const handleBackToCards = () => {
    setViewMode("cards");
    setMessages([]);
    setSelectedMenuId(undefined);
    setCollectedContext("");
  };

  const handleItemClick = async (item: CardItem) => {
    if (isLoading) return;

    // 특별 액션 처리
    if (item.action === "email_receive") {
      await handleEmailReceive();
      return;
    }

    if (item.action === "data_collection") {
      await handleDataCollection();
      return;
    }

    if (item.action === "similar_cases") {
      await handleSimilarCases();
      return;
    }

    if (item.action === "past_reports") {
      setReportListOpen(true);
      return;
    }

    // 일반 메시지 처리
    if (item.message) {
      setIsLoading(true);
      try {
        const chat = await createChat(selectedModel);
        if (chat) {
          const encodedMessage = encodeURIComponent(item.message);
          router.push(`/chat/${chat.id}?initialMessage=${encodedMessage}`);
        }
      } catch (error) {
        console.error("Failed to create chat:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmailReceive = async () => {
    setIsLoading(true);
    try {
      const chat = await createChat(selectedModel);
      if (chat) {
        // 특별 액션과 목업 데이터를 쿼리 파라미터로 전달
        const actionData = encodeURIComponent(JSON.stringify({
          action: "email_receive",
          data: MOCK_EMAIL_DATA,
        }));
        router.push(`/chat/${chat.id}?actionData=${actionData}`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataCollection = () => {
    // 데이터 수집 플로우 시작
    setViewMode("data_collection");
  };

  // 유사 사례 조회 핸들러
  const handleSimilarCases = async () => {
    if (!selectedTarget) {
      alert("분석 대상을 먼저 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // API에서 유사 사례 조회
      console.log("Fetching similar cases for:", selectedTarget);
      const response = await fetch("/api/analysis-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer: selectedTarget.customer,
          productModel: selectedTarget.productModel,
          defectType: selectedTarget.defectType,
          keywords: [selectedTarget.defectType],
        }),
      });
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", response.status, errorText);
        if (response.status === 401) {
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          return;
        }
        throw new Error("유사 사례 조회 실패: " + response.status);
      }

      const result = await response.json();
      const allCases = [...(result.exactMatches || []), ...(result.partialMatches || [])];

      // 유사 사례 데이터를 프롬프트용 텍스트로 변환
      let casesContext = `## 유사 사례 분석 데이터\n\n`;
      casesContext += `현재 분석 대상: ${selectedTarget.customer} / ${selectedTarget.productModel} / ${selectedTarget.defectType}\n\n`;

      if (allCases.length === 0) {
        casesContext += `조회된 유사 사례가 없습니다.\n`;
      } else {
        casesContext += `### 조회된 유사 사례 (${allCases.length}건)\n\n`;

        allCases.forEach((c: {
          caseNumber: string;
          customer: string;
          productModel: string;
          defectType: string;
          defectDescription: string;
          rootCause: string | null;
          analysisResult: string | null;
          correctiveAction: string | null;
          preventiveAction: string | null;
          responsibleDept: string | null;
          status: string;
          reportedAt: string;
        }, index: number) => {
          casesContext += `---\n`;
          casesContext += `#### 사례 ${index + 1}: ${c.caseNumber}\n`;
          casesContext += `- **고객사**: ${c.customer}\n`;
          casesContext += `- **제품모델**: ${c.productModel}\n`;
          casesContext += `- **결함유형**: ${c.defectType}\n`;
          casesContext += `- **결함설명**: ${c.defectDescription}\n`;
          casesContext += `- **근본원인**: ${c.rootCause || "분석중"}\n`;
          casesContext += `- **분석결과**: ${c.analysisResult || "분석중"}\n`;
          casesContext += `- **시정조치**: ${c.correctiveAction || "-"}\n`;
          casesContext += `- **예방조치**: ${c.preventiveAction || "-"}\n`;
          casesContext += `- **귀책부서**: ${c.responsibleDept || "-"}\n`;
          casesContext += `- **상태**: ${c.status}\n`;
          casesContext += `- **접수일**: ${new Date(c.reportedAt).toLocaleDateString("ko-KR")}\n\n`;
        });
      }

      // 채팅 생성 및 프롬프트 전송
      const chat = await createChat(selectedModel);
      if (chat) {
        const userMessage = `${selectedTarget.customer} 고객사의 ${selectedTarget.productModel} 제품에서 발생한 ${selectedTarget.defectType} 불량과 관련된 유사 사례를 분석해주세요. 과거 사례들의 원인, 조치 내용, 패턴을 분석하고 현재 건에 적용할 수 있는 인사이트를 제시해주세요.`;

        // sessionStorage에 컨텍스트 저장 (URL 길이 제한 회피)
        const actionDataObj = {
          action: "similar_cases",
          context: casesContext,
          initialMessage: userMessage,
        };
        sessionStorage.setItem(`chat_action_${chat.id}`, JSON.stringify(actionDataObj));
        console.log("Saved actionData to sessionStorage for chat:", chat.id);
        router.push(`/chat/${chat.id}?action=similar_cases`);
      }
    } catch (error) {
      console.error("유사 사례 조회 실패:", error);
      alert("유사 사례 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터 수집 완료 핸들러
  const handleDataCollectionComplete = async (context: string) => {
    setCollectedContext(context);
    setViewMode("chat");
    setSidebarOpen(true);

    // 데이터 수집 내용을 히스토리에 저장
    try {
      // 1. "데이터수집" 그룹 찾기 또는 생성
      const groupsResponse = await fetch("/api/groups");
      const currentGroups = groupsResponse.ok ? await groupsResponse.json() : [];

      let dataCollectionGroup = currentGroups.find((g: { name: string }) => g.name === "데이터수집");
      if (!dataCollectionGroup) {
        const newGroupResponse = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "데이터수집", color: "#3b82f6" }),
        });
        if (newGroupResponse.ok) {
          dataCollectionGroup = await newGroupResponse.json();
        }
      }

      if (dataCollectionGroup && selectedTarget) {
        // 2. 새 채팅 생성
        const chatTitle = `[수집] ${selectedTarget.customer} - ${selectedTarget.productModel} (${selectedTarget.defectType})`;
        const chatResponse = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: selectedModel,
            groupId: dataCollectionGroup.id,
            title: chatTitle,
          }),
        });

        if (chatResponse.ok) {
          const chat = await chatResponse.json();

          // 3. 수집된 데이터를 메시지로 저장
          const dataCollectionMessage = `## 데이터 수집 완료\n\n**분석 대상 정보:**\n- 고객사: ${selectedTarget.customer}\n- 제품모델: ${selectedTarget.productModel}\n- LOT ID: ${selectedTarget.lotId}\n- Cell ID: ${selectedTarget.cellId}\n- 결함유형: ${selectedTarget.defectType}\n- 접수일: ${selectedTarget.registeredAt}\n\n---\n\n${context}`;

          await fetch(`/api/chats/${chat.id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "USER", content: "데이터 수집을 완료했습니다." },
                { role: "ASSISTANT", content: dataCollectionMessage },
              ],
            }),
          });

          // 4. 그룹 및 채팅 목록 새로고침
          await Promise.all([fetchGroups(), fetchChats()]);
          console.log("데이터 수집 내용이 히스토리에 저장되었습니다.");
        }
      }
    } catch (error) {
      console.error("데이터 수집 저장 실패:", error);
    }

    // 수집된 데이터를 기반으로 첫 분석 요청
    const analysisPrompt = selectedTarget
      ? `${selectedTarget.customer} 고객사의 ${selectedTarget.productModel} 제품에서 발생한 ${selectedTarget.defectType} 불량에 대해 수집된 데이터를 분석하고, 원인 추정 및 개선 방안을 제시해주세요.`
      : "수집된 데이터를 분석하고 불량 원인 추정 및 개선 방안을 제시해주세요.";

    sendMessage(analysisPrompt, context);
  };

  // 데이터 수집 취소 핸들러
  const handleDataCollectionCancel = () => {
    setViewMode("cards");
  };

  // 데이터 재수집 핸들러
  const handleRecollect = (newTarget: BaseAnalysisTarget) => {
    // 기존 selectedTarget의 status를 유지하면서 새 분석 대상 정보 업데이트
    setSelectedTarget((prev) => ({
      ...prev!,
      ...newTarget,
      defectDescription: newTarget.defectDescription || prev!.defectDescription,
      registeredAt: newTarget.registeredAt || prev!.registeredAt,
    }));
    // viewMode는 이미 data_collection이므로 유지
  };

  // 분석 단계 선택 핸들러
  const handleAnalysisStageSelect = (stage: AnalysisStage) => {
    setCurrentAnalysisStage(stage);

    if (!selectedTarget) return;

    // 해당 단계에 따른 액션 수행
    let stageContent = "";
    let userMessage = "";

    switch (stage) {
      case "data_review":
        // 데이터 수집 내용 확인 - 사이드바 열기
        setSidebarOpen(true);
        userMessage = "수집된 데이터를 확인합니다.";
        stageContent = collectedContext || "데이터 수집 결과가 없습니다. 데이터 수집을 먼저 진행해주세요.";
        break;
      case "primary_analysis":
        // 1차 분석 결과 확인 - 이미 메시지가 있으면 스킵
        userMessage = "1차 분석 결과를 확인합니다.";
        if (messages.length === 0) {
          // 첫 분석 요청
          sendMessage(
            `${selectedTarget.customer} 고객사의 ${selectedTarget.productModel} 제품에서 발생한 ${selectedTarget.defectType} 불량에 대해 수집된 데이터를 분석하고, 원인 추정 및 개선 방안을 제시해주세요.`,
            collectedContext
          );
        }
        return; // sendMessage가 메시지를 추가하므로 여기서 리턴
      case "customer_contact":
        // 고객 담당자 확인
        userMessage = `${selectedTarget.customer} 고객사 담당자 정보를 조회합니다.`;
        stageContent = getCustomerContactPrompt(selectedTarget.customer);
        break;
      case "quality_review":
        // 품질 담당자/귀책부서 확인
        userMessage = `${selectedTarget.defectType} 불량 유형에 대한 품질담당자 및 귀책부서를 확인합니다.`;
        stageContent = getQualityReviewPrompt(selectedTarget.defectType);
        break;
      case "email_discussion":
        // 분석 협의 메일 발송
        userMessage = "분석 협의 메일을 작성합니다.";
        stageContent = getEmailDraftPrompt({
          caseId: selectedTarget.id,
          customer: selectedTarget.customer,
          productModel: selectedTarget.productModel,
          lotId: selectedTarget.lotId,
          defectType: selectedTarget.defectType,
          primaryAnalysis: messages.find(m => m.role === "assistant")?.content || "",
        });
        break;
      case "submit_result":
        // 분석 결과 상신
        userMessage = "분석 결과 보고서를 작성하여 상신합니다.";
        stageContent = getApprovalRequestPrompt({
          caseId: selectedTarget.id,
          customer: selectedTarget.customer,
          productModel: selectedTarget.productModel,
          defectType: selectedTarget.defectType,
          analysisResult: messages.find(m => m.role === "assistant")?.content || "",
        });
        break;
    }

    // 사용자 메시지 추가
    if (userMessage) {
      const newUserMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: userMessage,
      };
      setMessages((prev) => [...prev, newUserMessage]);
    }

    // 시스템 응답 추가
    if (stageContent) {
      setTimeout(() => {
        const newAssistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: stageContent,
        };
        setMessages((prev) => [...prev, newAssistantMessage]);

        // 해당 단계 완료 처리
        if (!completedAnalysisStages.includes(stage)) {
          setCompletedAnalysisStages((prev) => [...prev, stage]);
        }
      }, 500);
    }
  };

  // 기본분석 저장 핸들러
  const handleSaveAnalysis = async () => {
    if (!selectedTarget || messages.length === 0) {
      alert("저장할 분석 내용이 없습니다.");
      return;
    }

    // 저장 전 메시지 확인
    console.log("저장할 메시지:", messages);

    // Assistant 응답이 있는지 확인
    const assistantMessages = messages.filter(m => m.role === "assistant" && m.content.trim());
    if (assistantMessages.length === 0) {
      alert("분석 결과를 기다린 후 저장해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      // 1. 그룹 목록 직접 조회
      const groupsResponse = await fetch("/api/groups");
      const currentGroups = groupsResponse.ok ? await groupsResponse.json() : [];

      // 2. "기본분석" 그룹 찾기 또는 생성
      let analysisGroup = currentGroups.find((g: { name: string }) => g.name === "기본분석");
      if (!analysisGroup) {
        const newGroupResponse = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "기본분석", color: "#6366f1" }),
        });
        if (newGroupResponse.ok) {
          analysisGroup = await newGroupResponse.json();
        }
      }

      if (!analysisGroup) {
        throw new Error("그룹 생성 실패");
      }

      // 3. 새 채팅 생성 (그룹 ID 포함)
      const chatTitle = `${selectedTarget.customer} - ${selectedTarget.productModel} (${selectedTarget.defectType})`;
      const chatResponse = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: selectedModel,
          groupId: analysisGroup.id,
          title: chatTitle,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("채팅 생성 실패");
      }

      const chat = await chatResponse.json();

      // 4. 메시지 저장 - 빈 내용 제외
      const messagesToSave = messages
        .filter(m => m.content && m.content.trim())
        .map(m => ({
          role: m.role.toUpperCase(),
          content: m.content,
        }));

      console.log("API에 저장할 메시지:", messagesToSave);

      const saveMessagesResponse = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSave }),
      });

      if (!saveMessagesResponse.ok) {
        const errorData = await saveMessagesResponse.json();
        console.error("메시지 저장 실패:", errorData);
        throw new Error("메시지 저장 실패");
      }

      const saveResult = await saveMessagesResponse.json();
      console.log("저장 결과:", saveResult);

      // 5. 그룹 및 채팅 목록 새로고침
      await Promise.all([fetchGroups(), fetchChats()]);

      alert(`기본분석이 저장되었습니다. (${saveResult.count}개 메시지)`);

      // 저장 완료 후 카드 뷰로 돌아가기
      setViewMode("cards");
      setMessages([]);
      setCollectedContext("");

    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: AnalysisTarget["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">대기중</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">분석중</span>;
      case "completed":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">완료</span>;
    }
  };

  // 분석 작업용 카드 데이터 (고객불량 확인 제외)
  const ANALYSIS_CARDS = CARD_DATA.filter(card => card.id !== 1);

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 영역 - 타이틀과 분석 대상 선택 */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                품질분석 Chatbot
              </h1>
              {/* 메일 수신/접수 버튼 */}
              <button
                onClick={() => handleItemClick({ label: "고객불량 분석요청 메일 수신/접수", action: "email_receive" })}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                메일 수신/접수
              </button>
            </div>

            {/* 분석 대상 선택 콤보박스 */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors min-w-[300px]"
              >
                {selectedTarget ? (
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {selectedTarget.id}
                      </span>
                      {getStatusBadge(selectedTarget.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedTarget.customer} - {selectedTarget.productModel}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">분석 대상 선택...</span>
                )}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* 드롭다운 메뉴 */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-[400px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
                  {/* 등록된 분석 대상 목록 */}
                  {REGISTERED_TARGETS.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => {
                        setSelectedTarget(target);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedTarget?.id === target.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800">{target.id}</span>
                        {getStatusBadge(target.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {target.customer} | {target.productModel}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {target.defectType} - {target.registeredAt}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 선택된 분석 대상 정보 표시 - 컴팩트 버전 */}
        {selectedTarget && (
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3">
            <div className="flex items-center gap-6 flex-wrap">
              {/* 타이틀 및 ID */}
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">{selectedTarget.id}</span>
                {getStatusBadge(selectedTarget.status)}
              </div>

              {/* 정보 항목들 - 인라인 */}
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">고객사:</span>
                  <span className="font-medium text-gray-800">{selectedTarget.customer}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">제품:</span>
                  <span className="font-medium text-gray-800">{selectedTarget.productModel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">LOT:</span>
                  <span className="font-medium text-gray-800">{selectedTarget.lotId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">결함:</span>
                  <span className="font-medium text-red-600">{selectedTarget.defectType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 분석 대상 미선택 시 안내 */}
        {!selectedTarget && viewMode === "cards" && (
          <div className="mb-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-base font-medium text-gray-700 mb-1">분석 대상을 선택해주세요</h3>
            <p className="text-sm text-gray-500">상단에서 분석할 대상을 선택하거나 새 불량을 접수하세요.</p>
          </div>
        )}

        {/* 카드 뷰 모드 */}
        {viewMode === "cards" && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 ${!selectedTarget ? "opacity-50 pointer-events-none" : ""}`}>
            {ANALYSIS_CARDS.map((card, index) => {
              const isBottomRow = index >= 3;
              const colSpanClass = isBottomRow ? "lg:col-span-3" : "lg:col-span-2";

              return (
                <div
                  key={card.id}
                  className={`rounded-xl border-2 ${card.bgColor} transition-all duration-200 overflow-hidden ${colSpanClass}`}
                >
                  <div className={`px-3 py-2 border-b ${card.color} flex items-center gap-2`}>
                    <div className={`p-1.5 rounded-lg bg-white/50 ${card.color}`}>
                      {card.icon}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">{card.title}</h3>
                  </div>
                  <div className={`p-1.5 ${isBottomRow ? "flex flex-wrap gap-1" : ""}`}>
                    {card.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        onClick={() => handleItemClick(item)}
                        disabled={isLoading || !selectedTarget}
                        className={`text-left px-2.5 py-2 rounded-lg hover:bg-white/70 transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed ${
                          isBottomRow ? "flex-1 min-w-[140px]" : "w-full"
                        }`}
                      >
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.action ? (
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-700">채팅을 시작하는 중...</span>
            </div>
          </div>
        )}

        {/* 데이터 수집 플로우 뷰 모드 */}
        {viewMode === "data_collection" && selectedTarget && (
          <div className="h-[calc(100vh-220px)]">
            <DataCollectionFlow
              key={`${selectedTarget.productModel}-${selectedTarget.lotId}`}
              analysisTarget={{
                id: selectedTarget.id,
                customer: selectedTarget.customer,
                productModel: selectedTarget.productModel,
                lotId: selectedTarget.lotId,
                cellId: selectedTarget.cellId,
                defectType: selectedTarget.defectType,
                defectDescription: selectedTarget.defectDescription,
                registeredAt: selectedTarget.registeredAt,
              }}
              onComplete={handleDataCollectionComplete}
              onCancel={handleDataCollectionCancel}
              onRecollect={handleRecollect}
            />
          </div>
        )}
      </div>

      {/* 채팅 뷰 모드 */}
      {viewMode === "chat" && (
        <div className="flex flex-col flex-1 h-[calc(100vh-220px)]">
          {/* 기본분석 단계 헤더 */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToCards}
                  className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-indigo-400" />
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-semibold">기본분석</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500 rounded-full text-xs">
                  <span>진행중</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {selectedTarget && (
                  <>
                    <span className="text-indigo-200">{selectedTarget.customer}</span>
                    <span className="text-indigo-300">|</span>
                    <span className="text-indigo-200">{selectedTarget.productModel}</span>
                    <span className="text-indigo-300">|</span>
                    <span className="text-indigo-200">{selectedTarget.defectType}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* 채팅 메인 영역 */}
            <div className="flex-1 flex flex-col bg-white border-l border-r border-b border-gray-200 overflow-hidden rounded-bl-lg">
              {/* 채팅 서브 헤더 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800">1차분석 결과</span>
                </div>
                {collectedContext && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    데이터 수집 완료
                  </span>
                )}
              </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>우측 메뉴에서 조회할 데이터를 선택하거나</p>
                  <p>직접 질문을 입력하세요.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-600 text-white">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[90%] rounded-lg px-4 py-3 bg-white border border-gray-200 shadow-sm">
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <p className="text-sm text-gray-400">...</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

              {/* 입력 영역 */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    disabled={isChatLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !input.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* 데이터 수집 사이드바 (데이터 확인용) */}
            {currentAnalysisStage === "data_review" && (
              <DataCollectionSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onSelectMenu={handleSidebarMenuSelect}
                selectedMenuId={selectedMenuId}
              />
            )}

            {/* 분석 액션 사이드바 */}
            <AnalysisActionSidebar
              isOpen={analysisActionSidebarOpen}
              onClose={() => setAnalysisActionSidebarOpen(false)}
              currentStage={currentAnalysisStage}
              onStageSelect={handleAnalysisStageSelect}
              completedStages={completedAnalysisStages}
              onSave={handleSaveAnalysis}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* 과거 보고서 목록 모달 */}
      <ReportListModal
        isOpen={reportListOpen}
        onClose={() => {
          setReportListOpen(false);
          setSelectedReport(null);
        }}
        onViewReport={(report) => setSelectedReport(report)}
        selectedTarget={selectedTarget}
      />

      {/* 보고서 상세 뷰어 */}
      {selectedReport && (
        <ReportViewer
          report={selectedReport}
          onClose={() => {
            setSelectedReport(null);
            setReportListOpen(false);
          }}
          onBack={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
