import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { readFile, writeFile, readdir } from "fs/promises";
import path from "path";

const BACKEND_PATH = "/home/ptyoung/sdc-llm/backend/app";

// 수정 가능한 디렉토리 목록
const ALLOWED_DIRS = ["chains", "graphs", "routes"];

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { authorized: false, error: "Unauthorized" };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { authorized: false, error: "Forbidden" };
  return { authorized: true };
}

// 파일 경로 유효성 검사
function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  // 상위 디렉토리 접근 방지
  if (normalizedPath.includes("..")) return false;
  // 허용된 디렉토리인지 확인
  const parts = normalizedPath.split(path.sep);
  if (parts.length > 0 && ALLOWED_DIRS.includes(parts[0])) return true;
  return false;
}

// GET: 파일 목록 또는 파일 내용 가져오기
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      // 파일 목록 반환
      const files: { path: string; name: string; type: string }[] = [];

      for (const dir of ALLOWED_DIRS) {
        const dirPath = path.join(BACKEND_PATH, dir);
        try {
          const entries = await readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith(".py")) {
              files.push({
                path: path.join(dir, entry.name),
                name: entry.name,
                type: dir,
              });
            }
          }
        } catch {
          // 디렉토리가 없으면 무시
        }
      }

      return Response.json({ files });
    }

    // 파일 내용 반환
    if (!isValidPath(filePath)) {
      return Response.json({ error: "Invalid path" }, { status: 400 });
    }

    const fullPath = path.join(BACKEND_PATH, filePath);
    try {
      const content = await readFile(fullPath, "utf-8");
      return Response.json({ content, path: filePath });
    } catch {
      return Response.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error reading file:", error);
    return Response.json({ error: "Failed to read file" }, { status: 500 });
  }
}

// POST: 파일 저장
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdmin();
    if (!authCheck.authorized) {
      return Response.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return Response.json({ error: "Path and content are required" }, { status: 400 });
    }

    if (!isValidPath(filePath)) {
      return Response.json({ error: "Invalid path" }, { status: 400 });
    }

    const fullPath = path.join(BACKEND_PATH, filePath);
    await writeFile(fullPath, content, "utf-8");

    return Response.json({ success: true, message: "File saved successfully" });
  } catch (error) {
    console.error("Error saving file:", error);
    return Response.json({ error: "Failed to save file" }, { status: 500 });
  }
}
