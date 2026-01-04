import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 활성화된 모델 목록 (채팅에서 사용)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // DB에서 활성화된 모델 가져오기
    const customModels = await prisma.modelConfig.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        provider: true,
        endpoint: true,
        isDefault: true,
        temperature: true,
        maxTokens: true,
        systemPrompt: true,
        // apiKey는 보안상 제외
      },
      orderBy: [{ isDefault: "desc" }, { displayName: "asc" }],
    });

    // Ollama 모델도 가져오기
    let ollamaModels: { name: string; size: number }[] = [];
    try {
      const ollamaHost =
        process.env.OLLAMA_HOST || "http://localhost:11434";
      const response = await fetch(`${ollamaHost}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        ollamaModels = data.models || [];
      }
    } catch (error) {
      console.error("Error fetching Ollama models:", error);
    }

    return Response.json({
      customModels,
      ollamaModels,
      defaultModel: customModels.find((m) => m.isDefault)?.name || null,
    });
  } catch (error) {
    console.error("Error fetching configured models:", error);
    return Response.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
