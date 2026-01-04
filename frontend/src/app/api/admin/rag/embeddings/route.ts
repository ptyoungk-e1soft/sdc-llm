import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

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

export async function GET() {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const embeddings = await prisma.embeddingConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(embeddings);
  } catch (error) {
    console.error("Error fetching embeddings:", error);
    return Response.json({ error: "Failed to fetch embeddings" }, { status: 500 });
  }
}

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
    const { name, displayName, provider, modelName, endpoint, apiKey, dimension, isActive } = body;

    if (!name || !displayName) {
      return Response.json({ error: "Name and display name are required" }, { status: 400 });
    }

    const embedding = await prisma.embeddingConfig.create({
      data: {
        name,
        displayName,
        provider: provider || "OLLAMA",
        modelName: modelName || "nomic-embed-text",
        endpoint: endpoint || null,
        apiKey: apiKey || null,
        dimension: dimension || 768,
        isActive: isActive ?? true,
      },
    });

    return Response.json(embedding);
  } catch (error) {
    console.error("Error creating embedding:", error);
    return Response.json({ error: "Failed to create embedding" }, { status: 500 });
  }
}
