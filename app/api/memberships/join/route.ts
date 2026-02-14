import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

// POST: 원 연결 승인 요청 (보호자 → 관리자)
export async function POST(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const { groupId, petId } = body;

  if (!groupId || typeof groupId !== "string" || groupId.trim().length === 0) {
    return NextResponse.json(
      { error: "원을 선택해주세요." },
      { status: 400 }
    );
  }
  if (!petId || typeof petId !== "string" || petId.trim().length === 0) {
    return NextResponse.json(
      { error: "반려동물을 선택해주세요." },
      { status: 400 }
    );
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });
  if (!group) {
    return NextResponse.json({ error: "원을 찾을 수 없습니다." }, { status: 404 });
  }

  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerUserId: profile!.userId },
  });
  if (!pet) {
    return NextResponse.json(
      { error: "해당 반려동물에 대한 권한이 없습니다." },
      { status: 403 }
    );
  }

  const existing = await prisma.membership.findFirst({
    where: {
      userId: profile!.userId,
      groupId,
      petId,
    },
  });

  if (existing) {
    if (existing.status === "PENDING") {
      return NextResponse.json(
        { error: "이미 승인 요청 중입니다." },
        { status: 400 }
      );
    }
    if (existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "이미 연결되어 있습니다." },
        { status: 400 }
      );
    }
    // REJECTED인 경우 재요청 허용
    const updated = await prisma.membership.update({
      where: { id: existing.id },
      data: { status: "PENDING" },
      include: { group: true, pet: true },
    });
    return NextResponse.json(updated);
  }

  const membership = await prisma.membership.create({
    data: {
      userId: profile!.userId,
      groupId,
      petId,
      status: "PENDING",
    },
    include: {
      group: true,
      pet: true,
    },
  });

  return NextResponse.json(membership);
}
