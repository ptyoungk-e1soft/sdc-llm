import prisma from "@/lib/prisma";

const DEFAULT_MODEL = "qwen3:32b";

// GET: Get default model setting (public API)
export async function GET() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: "llm.defaultModel" },
    });

    return Response.json({
      defaultModel: setting?.value || DEFAULT_MODEL,
    });
  } catch (error) {
    console.error("Error fetching default model:", error);
    return Response.json({
      defaultModel: DEFAULT_MODEL,
    });
  }
}
