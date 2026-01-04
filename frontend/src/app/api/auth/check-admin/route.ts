import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ isAdmin: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    return Response.json({ isAdmin: user?.role === "ADMIN" });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return Response.json({ isAdmin: false });
  }
}
