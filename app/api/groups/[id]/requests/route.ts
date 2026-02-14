import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/auth";

// GET: 승인 대기 요청 목록
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const { id: groupId } = await params;

  const group = await prisma.group.findFirst({
    where: { id: groupId, ownerUserId: profile!.userId },
  });
  if (!group) {
    return NextResponse.json({ error: "원을 찾을 수 없습니다." }, { status: 404 });
  }

  const requests = await prisma.membership.findMany({
    where: { groupId, status: "PENDING" },
    include: { pet: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
