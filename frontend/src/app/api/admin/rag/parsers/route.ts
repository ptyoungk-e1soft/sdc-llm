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
    const parsers = await prisma.parserConfig.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(parsers);
  } catch (error) {
    console.error("Error fetching parsers:", error);
    return Response.json({ error: "Failed to fetch parsers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const body = await request.json();
    const { name, displayName, type, settings, isActive } = body;
    if (!name || !displayName) return Response.json({ error: "Name and display name are required" }, { status: 400 });
    const parser = await prisma.parserConfig.create({
      data: { name, displayName, type: type || "DEFAULT", settings, isActive: isActive ?? true },
    });
    return Response.json(parser);
  } catch (error) {
    console.error("Error creating parser:", error);
    return Response.json({ error: "Failed to create parser" }, { status: 500 });
  }
}
