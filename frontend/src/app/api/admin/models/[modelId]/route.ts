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

// GET: 특정 모델 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const { modelId } = await params;
    const model = await prisma.modelConfig.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return Response.json({ error: "Model not found" }, { status: 404 });
    }

    return Response.json(model);
  } catch (error) {
    console.error("Error fetching model:", error);
    return Response.json({ error: "Failed to fetch model" }, { status: 500 });
  }
}

// PATCH: 모델 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const { modelId } = await params;
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

    // 기본 모델로 설정하면 다른 모델의 기본 설정 해제
    if (isDefault) {
      await prisma.modelConfig.updateMany({
        where: { isDefault: true, id: { not: modelId } },
        data: { isDefault: false },
      });
    }

    const model = await prisma.modelConfig.update({
      where: { id: modelId },
      data: {
        ...(name !== undefined && { name }),
        ...(displayName !== undefined && { displayName }),
        ...(provider !== undefined && { provider }),
        ...(endpoint !== undefined && { endpoint }),
        ...(apiKey !== undefined && { apiKey }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(systemPrompt !== undefined && { systemPrompt }),
      },
    });

    return Response.json(model);
  } catch (error) {
    console.error("Error updating model:", error);
    return Response.json({ error: "Failed to update model" }, { status: 500 });
  }
}

// DELETE: 모델 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const { modelId } = await params;
    await prisma.modelConfig.delete({
      where: { id: modelId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting model:", error);
    return Response.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
