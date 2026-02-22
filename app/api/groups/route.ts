import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/api/auth";

type GroupWithMembershipCounts = Prisma.GroupGetPayload<{
  include: { memberships: { select: { status: true } } };
}>;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sido = searchParams.get("sido");
  const search = searchParams.get("search");
  const q = searchParams.get("q");

  // 원 검색 (전체/시/도/키워드 필터) - 인증된 사용자
  if (search === "1") {
    const { error } = await getAuthUser();
    if (error) return error;

    const where: { sido?: string; name?: { contains: string; mode: "insensitive" } } = {};
    if (sido && typeof sido === "string" && sido.trim()) {
      where.sido = sido.trim();
    }
    if (q && typeof q === "string" && q.trim()) {
      where.name = { contains: q.trim(), mode: "insensitive" };
    }
    const groups = await prisma.group.findMany({
      where,
      orderBy: [{ sido: "asc" }, { name: "asc" }],
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
      memberships: { select: { status: true } },
    },
  });

  const groupsWithCounts = groups.map((g: GroupWithMembershipCounts) => {
    const approved = g.memberships.filter((m) => m.status === "APPROVED").length;
    const pending = g.memberships.filter((m) => m.status === "PENDING").length;
    const rejected = g.memberships.filter((m) => m.status === "REJECTED").length;
    const { memberships, ...rest } = g;
    return {
      ...rest,
      membershipCounts: { approved, pending, rejected },
    };
  });

  return NextResponse.json(groupsWithCounts);
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
