import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// GET: Get a single group with its users
export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { groupId } = await params;

    const group = await prisma.userGroup.findUnique({
      where: { id: groupId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    return Response.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return Response.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

// PATCH: Update a group
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { groupId } = await params;
    const { name, description } = await req.json();

    const group = await prisma.userGroup.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return Response.json(group);
  } catch (error) {
    console.error("Error updating group:", error);
    return Response.json({ error: "Failed to update group" }, { status: 500 });
  }
}

// DELETE: Delete a group
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { groupId } = await params;

    await prisma.userGroup.delete({
      where: { id: groupId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return Response.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
