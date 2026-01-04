import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// Default LLM settings
const DEFAULT_SETTINGS = {
  "llm.defaultModel": "qwen3:32b",
  "llm.temperature": "0.7",
  "llm.maxTokens": "4096",
  "llm.systemPrompt": "You are a helpful AI assistant. Respond in the same language as the user.",
  "llm.ollamaHost": "http://localhost:11434",
};

// GET: Get all settings
export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const settings = await prisma.systemSettings.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: "asc" },
    });

    // Merge with defaults
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return Response.json(settingsMap);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST: Update settings (bulk)
export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await req.json();

    // Update each setting
    const updates = Object.entries(settings).map(([key, value]) => {
      const category = key.split(".")[0] || "general";
      return prisma.systemSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), category },
      });
    });

    await Promise.all(updates);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return Response.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
