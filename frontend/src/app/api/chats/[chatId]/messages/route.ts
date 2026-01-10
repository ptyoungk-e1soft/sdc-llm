import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

interface RouteContext {
  params: Promise<{ chatId: string }>;
}

interface MessageInput {
  role: string;
  content: string;
}

// Role 문자열을 Prisma Role enum으로 변환
function toRole(role: string): Role {
  const upperRole = role.toUpperCase();
  if (upperRole === "USER") return Role.USER;
  if (upperRole === "ASSISTANT") return Role.ASSISTANT;
  if (upperRole === "SYSTEM") return Role.SYSTEM;
  return Role.USER; // 기본값
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { chatId } = await context.params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 채팅이 해당 유저의 것인지 확인
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const { messages } = await req.json();

    console.log("Received messages to save:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // 빈 내용 필터링
    const validMessages = messages.filter(
      (msg: MessageInput) => msg.content && msg.content.trim()
    );

    console.log("Valid messages count:", validMessages.length);

    if (validMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages to save" },
        { status: 400 }
      );
    }

    // 메시지 일괄 저장
    const createdMessages = await prisma.message.createMany({
      data: validMessages.map((msg: MessageInput) => ({
        chatId,
        role: toRole(msg.role),
        content: msg.content,
      })),
    });

    console.log("Created messages count:", createdMessages.count);

    return NextResponse.json({
      success: true,
      count: createdMessages.count,
    });
  } catch (error) {
    console.error("Error saving messages:", error);
    return NextResponse.json(
      { error: "Failed to save messages" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { chatId } = await context.params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 채팅이 해당 유저의 것인지 확인
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
