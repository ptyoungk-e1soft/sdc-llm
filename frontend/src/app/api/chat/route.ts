import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, model, chatId, debug } = await req.json();

    // Extract content from messages (handle both old format and new parts format)
    const getContent = (msg: { content?: string; parts?: { type: string; text: string }[] }) => {
      if (msg.content) return msg.content;
      if (msg.parts) {
        return msg.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("");
      }
      return "";
    };

    // Save user message to database
    if (chatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastContent = getContent(lastMessage);
      if (lastMessage.role === "user" && lastContent) {
        await prisma.message.create({
          data: {
            chatId,
            role: "USER",
            content: lastContent,
          },
        });

        // Update chat title if it's the first message
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { messages: { take: 1 } },
        });

        if (chat && chat.messages.length <= 1) {
          await prisma.chat.update({
            where: { id: chatId },
            data: {
              title: lastContent.slice(0, 50) + (lastContent.length > 50 ? "..." : ""),
            },
          });
        }
      }
    }

    // Format messages for backend
    const backendMessages = messages.map((msg: { role: string; content?: string; parts?: { type: string; text: string }[] }) => ({
      role: msg.role,
      content: getContent(msg),
    }));

    // Call LangGraph streaming endpoint
    const response = await fetch(`${BACKEND_URL}/graph/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: backendMessages,
        model: model || "qwen3:32b",
        debug: debug || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    fullResponse += data.content;
                    // Format as AI SDK compatible stream
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(data.content)}\n`));
                  }
                  // Pass through debug events
                  if (debug && data.type) {
                    controller.enqueue(encoder.encode(`d:${JSON.stringify(data)}\n`));
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Save assistant message to database
          if (chatId && fullResponse) {
            await prisma.message.create({
              data: {
                chatId,
                role: "ASSISTANT",
                content: fullResponse,
              },
            });
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat" }),
      { status: 500 }
    );
  }
}
