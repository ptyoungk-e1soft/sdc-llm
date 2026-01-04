import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { authorized: false, error: "Unauthorized" };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return { authorized: false, error: "Forbidden" };
  return { authorized: true };
}

export async function GET() {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    }

    const pipelines = await prisma.rAGPipeline.findMany({
      include: {
        embedding: true,
        vectorDB: true,
        chunk: true,
        parser: true,
        reranker: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return Response.json(pipelines);
  } catch (error) {
    console.error("Error fetching pipelines:", error);
    return Response.json({ error: "Failed to fetch pipelines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    }

    const body = await request.json();
    const {
      name, displayName, description, embeddingId, vectorDBId, chunkId,
      parserId, rerankerId, modelConfigId, topK, scoreThreshold,
      systemPrompt, contextTemplate, isActive, isDefault,
    } = body;

    if (!name || !displayName || !embeddingId || !vectorDBId || !chunkId) {
      return Response.json({ error: "Required fields missing" }, { status: 400 });
    }

    // 기본 파이프라인으로 설정하면 다른 파이프라인의 기본 설정 해제
    if (isDefault) {
      await prisma.rAGPipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.rAGPipeline.create({
      data: {
        name, displayName, description,
        embeddingId, vectorDBId, chunkId, parserId, rerankerId, modelConfigId,
        topK: topK || 5, scoreThreshold: scoreThreshold || 0.7,
        systemPrompt, contextTemplate, isActive: isActive ?? true, isDefault: isDefault ?? false,
      },
      include: {
        embedding: true,
        vectorDB: true,
        chunk: true,
        parser: true,
        reranker: true,
      },
    });

    return Response.json(pipeline);
  } catch (error) {
    console.error("Error creating pipeline:", error);
    return Response.json({ error: "Failed to create pipeline" }, { status: 500 });
  }
}
