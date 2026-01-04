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
    const chunks = await prisma.chunkConfig.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(chunks);
  } catch (error) {
    console.error("Error fetching chunks:", error);
    return Response.json({ error: "Failed to fetch chunks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const body = await request.json();
    const { name, displayName, strategy, chunkSize, chunkOverlap, separators, isActive } = body;
    if (!name || !displayName) return Response.json({ error: "Name and display name are required" }, { status: 400 });
    const chunk = await prisma.chunkConfig.create({
      data: {
        name, displayName, strategy: strategy || "RECURSIVE",
        chunkSize: chunkSize || 1000, chunkOverlap: chunkOverlap || 200,
        separators, isActive: isActive ?? true,
      },
    });
    return Response.json(chunk);
  } catch (error) {
    console.error("Error creating chunk:", error);
    return Response.json({ error: "Failed to create chunk" }, { status: 500 });
  }
}
