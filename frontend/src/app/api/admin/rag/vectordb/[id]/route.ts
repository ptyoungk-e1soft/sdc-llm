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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    const body = await request.json();
    const vectorDB = await prisma.vectorDBConfig.update({ where: { id }, data: body });
    return Response.json(vectorDB);
  } catch (error) {
    console.error("Error updating vectorDB:", error);
    return Response.json({ error: "Failed to update vectorDB" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    await prisma.vectorDBConfig.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting vectorDB:", error);
    return Response.json({ error: "Failed to delete vectorDB" }, { status: 500 });
  }
}
