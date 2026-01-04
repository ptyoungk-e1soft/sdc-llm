import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import bcrypt from "bcryptjs";

// GET: Get a single user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chats: true,
            chatGroups: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PATCH: Update a user
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await params;
    const { name, email, password, role, isActive, userGroupId } = await req.json();

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (userGroupId !== undefined) updateData.userGroupId = userGroupId || null;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        userGroupId: true,
        userGroup: {
          select: { id: true, name: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE: Delete a user
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await params;

    await prisma.user.delete({
      where: { id: userId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
