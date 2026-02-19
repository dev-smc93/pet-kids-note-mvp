import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

// POST: 읽음 처리 (보호자만)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  if (profile!.role !== "GUARDIAN") {
    return NextResponse.json(
      { error: "보호자만 읽음 처리할 수 있습니다." },
      { status: 403 }
    );
  }

  const { id: reportId } = await params;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { pet: true },
  });

  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  if (report.pet.ownerUserId !== profile!.userId) {
    return NextResponse.json(
      { error: "해당 알림장에 대한 열람 권한이 없습니다." },
      { status: 403 }
    );
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
