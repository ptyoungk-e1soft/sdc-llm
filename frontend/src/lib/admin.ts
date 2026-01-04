import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function isAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return true;
}
