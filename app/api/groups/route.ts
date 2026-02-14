import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/api/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sido = searchParams.get("sido");

  // 원 검색 (시/도 필터) - 인증된 사용자
  if (sido && typeof sido === "string" && sido.trim()) {
    const { error } = await getAuthUser();
    if (error) return error;

    const groups = await prisma.group.findMany({
      where: { sido: sido.trim() },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sido: true,
        sigungu: true,
        address: true,
      },
    });
    return NextResponse.json(groups);
  }

  // 내 원 목록 (관리자)
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const groups = await prisma.group.findMany({
    where: { ownerUserId: profile!.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true } },
    },
  });

  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { name, sido, sigungu, address } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "원 이름을 입력해주세요." },
      { status: 400 }
    );
  }
  if (!sido || typeof sido !== "string" || sido.trim().length === 0) {
    return NextResponse.json(
      { error: "시/도를 입력해주세요." },
      { status: 400 }
    );
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      ownerUserId: profile!.userId,
      sido: (sido || "").trim(),
      sigungu: typeof sigungu === "string" ? sigungu.trim() : "",
      address: typeof address === "string" ? address.trim() : "",
    },
  });

  return NextResponse.json(group);
}
