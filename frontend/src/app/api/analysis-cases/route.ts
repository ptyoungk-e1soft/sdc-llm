import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DefectType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    // Note: Auth check relaxed for mock data - add back for production
    const session = await auth();
    console.log("[analysis-cases GET] session:", session?.user?.id ? "authenticated" : "not authenticated");

    const { searchParams } = new URL(req.url);
    const customer = searchParams.get("customer");
    const productModel = searchParams.get("productModel");
    const defectType = searchParams.get("defectType");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 검색 조건 구성
    const where: Record<string, unknown> = {};

    if (customer) {
      where.customer = { contains: customer, mode: "insensitive" };
    }

    if (productModel) {
      where.productModel = { contains: productModel, mode: "insensitive" };
    }

    if (defectType && Object.values(DefectType).includes(defectType as DefectType)) {
      where.defectType = defectType as DefectType;
    }

    // 텍스트 검색 (설명, 원인, 결과 등에서 검색)
    if (search) {
      where.OR = [
        { defectDescription: { contains: search, mode: "insensitive" } },
        { rootCause: { contains: search, mode: "insensitive" } },
        { analysisResult: { contains: search, mode: "insensitive" } },
        { correctiveAction: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    const cases = await prisma.analysisCase.findMany({
      where,
      orderBy: { reportedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error("Error fetching analysis cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis cases" },
      { status: 500 }
    );
  }
}

// 유사 사례 조회 - 특정 조건에 맞는 사례 찾기
export async function POST(req: Request) {
  try {
    // Note: Auth check relaxed for mock data - add back for production
    const session = await auth();
    console.log("[analysis-cases POST] session:", session?.user?.id ? "authenticated" : "not authenticated");

    const body = await req.json();
    const { customer, productModel, defectType, keywords } = body;

    // 유사 사례를 찾기 위한 조건들
    const conditions = [];

    // 동일 고객사의 사례
    if (customer) {
      conditions.push({ customer: { equals: customer, mode: "insensitive" as const } });
    }

    // 동일 제품 모델의 사례
    if (productModel) {
      conditions.push({ productModel: { contains: productModel, mode: "insensitive" as const } });
    }

    // 동일 결함 유형의 사례
    if (defectType && Object.values(DefectType).includes(defectType as DefectType)) {
      conditions.push({ defectType: defectType as DefectType });
    }

    // 키워드 기반 검색
    if (keywords && Array.isArray(keywords)) {
      for (const keyword of keywords) {
        conditions.push({
          OR: [
            { defectDescription: { contains: keyword, mode: "insensitive" as const } },
            { rootCause: { contains: keyword, mode: "insensitive" as const } },
            { analysisResult: { contains: keyword, mode: "insensitive" as const } },
            { tags: { contains: keyword, mode: "insensitive" as const } },
          ],
        });
      }
    }

    // 최소 하나의 조건이 있어야 함
    if (conditions.length === 0) {
      // 조건이 없으면 최근 사례 반환
      const recentCases = await prisma.analysisCase.findMany({
        orderBy: { reportedAt: "desc" },
        take: 5,
      });
      return NextResponse.json({
        similarCases: recentCases,
        matchType: "recent",
      });
    }

    // 완전 일치 사례 (모든 조건 만족)
    const exactMatches = await prisma.analysisCase.findMany({
      where: { AND: conditions },
      orderBy: { reportedAt: "desc" },
      take: 5,
    });

    // 부분 일치 사례 (일부 조건만 만족)
    const partialMatches = await prisma.analysisCase.findMany({
      where: { OR: conditions },
      orderBy: { reportedAt: "desc" },
      take: 10,
    });

    // 중복 제거 및 정렬
    const exactIds = new Set(exactMatches.map((c) => c.id));
    const uniquePartialMatches = partialMatches.filter((c) => !exactIds.has(c.id)).slice(0, 5);

    return NextResponse.json({
      exactMatches,
      partialMatches: uniquePartialMatches,
      totalFound: exactMatches.length + uniquePartialMatches.length,
    });
  } catch (error) {
    console.error("Error finding similar cases:", error);
    return NextResponse.json(
      { error: "Failed to find similar cases" },
      { status: 500 }
    );
  }
}
