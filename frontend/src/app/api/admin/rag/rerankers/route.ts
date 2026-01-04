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
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const rerankers = await prisma.rerankerConfig.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(rerankers);
  } catch (error) {
    console.error("Error fetching rerankers:", error);
    return Response.json({ error: "Failed to fetch rerankers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const body = await request.json();
    const { name, displayName, type, modelName, endpoint, apiKey, topK, isActive } = body;
    if (!name || !displayName) return Response.json({ error: "Name and display name are required" }, { status: 400 });
    const reranker = await prisma.rerankerConfig.create({
      data: { name, displayName, type: type || "NONE", modelName, endpoint, apiKey, topK: topK || 5, isActive: isActive ?? true },
    });
    return Response.json(reranker);
  } catch (error) {
    console.error("Error creating reranker:", error);
    return Response.json({ error: "Failed to create reranker" }, { status: 500 });
  }
}
