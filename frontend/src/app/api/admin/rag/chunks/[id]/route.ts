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
    const chunk = await prisma.chunkConfig.update({ where: { id }, data: await request.json() });
    return Response.json(chunk);
  } catch (error) {
    console.error("Error updating chunk:", error);
    return Response.json({ error: "Failed to update chunk" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    await prisma.chunkConfig.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return Response.json({ error: "Failed to delete chunk" }, { status: 500 });
  }
}
