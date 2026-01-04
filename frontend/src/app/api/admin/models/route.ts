import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

// 관리자 권한 확인
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true };
}

// GET: 모델 목록 조회
export async function GET() {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const models = await prisma.modelConfig.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return Response.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return Response.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

// POST: 새 모델 추가
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      displayName,
      provider,
      endpoint,
      apiKey,
      isActive,
      isDefault,
      temperature,
      maxTokens,
      systemPrompt,
    } = body;

    if (!name || !displayName) {
      return Response.json(
        { error: "Name and display name are required" },
        { status: 400 }
      );
    }

    // 기본 모델로 설정하면 다른 모델의 기본 설정 해제
    if (isDefault) {
      await prisma.modelConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.modelConfig.create({
      data: {
        name,
        displayName,
        provider: provider || "OLLAMA",
        endpoint: endpoint || null,
        apiKey: apiKey || null,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4096,
        systemPrompt: systemPrompt || null,
      },
    });

    return Response.json(model);
  } catch (error) {
    console.error("Error creating model:", error);
    return Response.json({ error: "Failed to create model" }, { status: 500 });
  }
}
