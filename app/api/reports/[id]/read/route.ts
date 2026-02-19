import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

// POST: 읽음 처리 (보호자: 본인 열람 / 관리자: 본인 열람)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: reportId } = await params;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { pet: true },
  });

  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  if (profile!.role === "GUARDIAN") {
    if (report.pet.ownerUserId !== profile!.userId) {
      return NextResponse.json(
        { error: "해당 알림장에 대한 열람 권한이 없습니다." },
        { status: 403 }
      );
    }
  } else if (profile!.role === "ADMIN") {
    const group = await prisma.group.findFirst({
      where: {
        ownerUserId: profile!.userId,
        memberships: {
          some: { petId: report.petId, status: "APPROVED" },
        },
      },
    });
    if (!group) {
      return NextResponse.json(
        { error: "해당 알림장에 대한 열람 권한이 없습니다." },
        { status: 403 }
      );
    }
  } else {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await prisma.reportRead.upsert({
    where: {
      reportId_userId: { reportId, userId: profile!.userId },
    },
    create: { reportId, userId: profile!.userId },
    update: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
