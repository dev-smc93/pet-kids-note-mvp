import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthUser } from "@/lib/api/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: membershipId } = await params;

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });
  if (!membership) {
    return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
  }
  if (membership.userId !== profile!.userId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (membership.status !== "REJECTED") {
    return NextResponse.json(
      { error: "거절된 요청만 삭제할 수 있습니다." },
      { status: 400 }
    );
  }

  await prisma.membership.delete({
    where: { id: membershipId },
  });

  return NextResponse.json({ ok: true });
}

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

  if (status === "APPROVED") {
    const approvedElsewhere = await prisma.membership.findFirst({
      where: {
        petId: membership.petId,
        status: "APPROVED",
        id: { not: membershipId },
      },
    });
    if (approvedElsewhere) {
      return NextResponse.json(
        { error: "해당 반려동물은 이미 다른 원에 연결되어 있습니다." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { status },
    include: { group: true, pet: true, user: true },
  });

  return NextResponse.json(updated);
}
