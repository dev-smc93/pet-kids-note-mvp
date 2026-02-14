import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/auth";

// PATCH: 승인(APPROVED) 또는 거절(REJECTED)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const { id: membershipId } = await params;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId },
    include: { group: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
  }
  if (membership.group.ownerUserId !== profile!.userId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (membership.status !== "PENDING") {
    return NextResponse.json(
      { error: "이미 처리된 요청입니다." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { status } = body;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: "status는 APPROVED 또는 REJECTED여야 합니다." },
      { status: 400 }
    );
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { status },
    include: { group: true, pet: true, user: true },
  });

  return NextResponse.json(updated);
}
