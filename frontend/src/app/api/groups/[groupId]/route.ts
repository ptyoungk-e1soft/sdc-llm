import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

// PATCH /api/groups/[groupId] - Update a group
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { groupId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await req.json();

    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || group.userId !== session.user.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const updatedGroup = await prisma.chatGroup.update({
      where: { id: groupId },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId] - Delete a group
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { groupId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || group.userId !== session.user.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Move chats to ungrouped before deleting the group
    await prisma.chat.updateMany({
      where: { groupId },
      data: { groupId: null },
    });

    await prisma.chatGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
