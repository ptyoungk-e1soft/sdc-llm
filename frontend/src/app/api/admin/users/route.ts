import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import bcrypt from "bcryptjs";

// GET: List all users
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        userGroupId: true,
        userGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chats: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, password, role, userGroupId } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        userGroupId: userGroupId || null,
      },
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
      },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}
