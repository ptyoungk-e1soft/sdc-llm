import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/groups - Get all groups for current user (hierarchical)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.chatGroup.findMany({
      where: { userId: session.user.id },
      include: {
        chats: {
          select: { id: true },
        },
        children: {
          include: {
            chats: {
              select: { id: true },
            },
            children: {
              include: {
                chats: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color, parentId } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Verify parent group belongs to user if parentId is provided
    if (parentId) {
      const parentGroup = await prisma.chatGroup.findFirst({
        where: { id: parentId, userId: session.user.id },
      });
      if (!parentGroup) {
        return NextResponse.json(
          { error: "Parent group not found" },
          { status: 404 }
        );
      }
    }

    const group = await prisma.chatGroup.create({
      data: {
        name: name.trim(),
        color: color || "#6B7280",
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        chats: {
          select: { id: true },
        },
        children: true,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
