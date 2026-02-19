import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/auth";

// POST: 재알림 (관리자) - MVP에서는 표시/버튼만, 실제 푸시는 추후
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const { id: reportId } = await params;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      pet: true,
      reportReads: true,
    },
  });

  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

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
      { error: "해당 알림장에 대한 권한이 없습니다." },
      { status: 403 }
    );
  }

  const guardianUserId = report.pet.ownerUserId;
  const hasRead = report.reportReads.some((r) => r.userId === guardianUserId);

  if (hasRead) {
    return NextResponse.json({
      success: true,
      message: "이미 열람한 보호자입니다.",
    });
  }

  // MVP: 재알림 버튼 동작만 (실제 푸시 알림은 2차)
  return NextResponse.json({
    success: true,
    message: "재알림 요청이 완료되었습니다. (푸시 알림은 추후 적용 예정)",
  });
}
