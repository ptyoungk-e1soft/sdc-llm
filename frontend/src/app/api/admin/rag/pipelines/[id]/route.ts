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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    const pipeline = await prisma.rAGPipeline.findUnique({
      where: { id },
      include: { embedding: true, vectorDB: true, chunk: true, parser: true, reranker: true },
    });
    if (!pipeline) return Response.json({ error: "Pipeline not found" }, { status: 404 });
    return Response.json(pipeline);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    return Response.json({ error: "Failed to fetch pipeline" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    const body = await request.json();

    // 기본 파이프라인 설정
    if (body.isDefault) {
      await prisma.rAGPipeline.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.rAGPipeline.update({
      where: { id },
      data: body,
      include: { embedding: true, vectorDB: true, chunk: true, parser: true, reranker: true },
    });
    return Response.json(pipeline);
  } catch (error) {
    console.error("Error updating pipeline:", error);
    return Response.json({ error: "Failed to update pipeline" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    await prisma.rAGPipeline.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting pipeline:", error);
    return Response.json({ error: "Failed to delete pipeline" }, { status: 500 });
  }
}
