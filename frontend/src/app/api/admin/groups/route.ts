import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// GET: List all user groups
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const groups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return Response.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

// POST: Create a new user group
export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return Response.json({ error: "Group name is required" }, { status: 400 });
    }

    const group = await prisma.userGroup.create({
      data: { name, description },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return Response.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return Response.json({ error: "Failed to create group" }, { status: 500 });
  }
}
