import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { authorized: false, error: "Unauthorized" };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { authorized: false, error: "Forbidden" };
  return { authorized: true };
}

export async function GET() {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    }
    const vectorDBs = await prisma.vectorDBConfig.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(vectorDBs);
  } catch (error) {
    console.error("Error fetching vectorDBs:", error);
    return Response.json({ error: "Failed to fetch vectorDBs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    }
    const body = await request.json();
    const { name, displayName, type, connectionUrl, apiKey, collectionName, settings, isActive } = body;
    if (!name || !displayName) {
      return Response.json({ error: "Name and display name are required" }, { status: 400 });
    }
    const vectorDB = await prisma.vectorDBConfig.create({
      data: {
        name, displayName, type: type || "CHROMA", connectionUrl, apiKey,
        collectionName: collectionName || "default", settings, isActive: isActive ?? true,
      },
    });
    return Response.json(vectorDB);
  } catch (error) {
    console.error("Error creating vectorDB:", error);
    return Response.json({ error: "Failed to create vectorDB" }, { status: 500 });
  }
}
