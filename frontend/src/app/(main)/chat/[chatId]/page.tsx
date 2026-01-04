import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChatContainer } from "@/components/chat/ChatContainer";

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default async function ChatDetailPage({ params }: ChatPageProps) {
  const { chatId } = await params;
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

  return <ChatContainer chatId={chatId} initialMessages={initialMessages} />;
}
