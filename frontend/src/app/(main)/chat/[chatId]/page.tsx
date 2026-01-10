import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChatContainer } from "@/components/chat/ChatContainer";

interface EmailReceiveData {
  customer: string;
  productModel: string;
  lotId: string;
  cellId: string;
  defectType: string;
  defectDescription: string;
  emailContent: string;
}

interface ActionData {
  action: string;
  data?: EmailReceiveData;
  context?: string;        // 유사 사례 등 컨텍스트 데이터
  initialMessage?: string; // 컨텍스트와 함께 보낼 초기 메시지
}

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
  searchParams: Promise<{
    initialMessage?: string;
    actionData?: string;
  }>;
}

export default async function ChatDetailPage({ params, searchParams }: ChatPageProps) {
  const { chatId } = await params;
  const { initialMessage, actionData: actionDataStr } = await searchParams;

  // Parse actionData if present
  let actionData: ActionData | undefined;
  if (actionDataStr) {
    try {
      actionData = JSON.parse(decodeURIComponent(actionDataStr));
      console.log("[Server] Parsed actionData:", actionData?.action, "context length:", actionData?.context?.length);
    } catch (e) {
      console.error("[Server] Failed to parse actionData:", e);
    }
  }
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
      userId: session.user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    notFound();
  }

  // Convert to new UIMessage format with parts array
  const initialMessages = chat.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }));

  return (
    <ChatContainer
      chatId={chatId}
      initialMessages={initialMessages}
      initialMessage={initialMessage}
      actionData={actionData}
    />
  );
}
