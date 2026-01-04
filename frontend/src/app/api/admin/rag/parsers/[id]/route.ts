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
    const parser = await prisma.parserConfig.update({ where: { id }, data: await request.json() });
    return Response.json(parser);
  } catch (error) {
    console.error("Error updating parser:", error);
    return Response.json({ error: "Failed to update parser" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) return Response.json({ error: authCheck.error }, { status: authCheck.error === "Unauthorized" ? 401 : 403 });
    const { id } = await params;
    await prisma.parserConfig.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting parser:", error);
    return Response.json({ error: "Failed to delete parser" }, { status: 500 });
  }
}
