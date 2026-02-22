import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

// GET: 댓글 목록 (또는 예약 댓글: ?scheduled=true)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: reportId } = await params;
  const { searchParams } = new URL(request.url);
  const scheduledOnly = searchParams.get("scheduled") === "true";

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { pet: true },
  });

  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  let hasAccess = false;
  if (profile!.role === "GUARDIAN") {
    hasAccess = report.pet.ownerUserId === profile!.userId;
  } else {
    const group = await prisma.group.findFirst({
      where: {
        ownerUserId: profile!.userId,
        memberships: {
          some: { petId: report.petId, status: "APPROVED" },
        },
      },
    });
    hasAccess = !!group;
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: "해당 알림장에 대한 열람 권한이 없습니다." },
      { status: 403 }
    );
  }

  const now = new Date();

  if (scheduledOnly) {
    const scheduled = await prisma.reportComment.findMany({
      where: {
        reportId,
        authorUserId: profile!.userId,
        scheduledAt: { gt: now },
      },
      include: { author: { select: { userId: true, name: true, role: true } } },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(scheduled, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
    });
  }

  const comments = await prisma.reportComment.findMany({
    where: {
      reportId,
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } },
      ],
    },
    include: { author: { select: { userId: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments, {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
  });
}

// POST: 댓글 작성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: reportId } = await params;

  const body = await request.json();
  const content = body?.content;
  const scheduledAt = body?.scheduledAt;

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json(
      { error: "댓글 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const scheduledAtDate =
    scheduledAt && typeof scheduledAt === "string"
      ? new Date(scheduledAt)
      : null;
  if (scheduledAtDate && isNaN(scheduledAtDate.getTime())) {
    return NextResponse.json(
      { error: "예약 시간이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { pet: true },
  });

  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  let hasAccess = false;
  if (profile!.role === "GUARDIAN") {
    hasAccess = report.pet.ownerUserId === profile!.userId;
  } else {
    const group = await prisma.group.findFirst({
      where: {
        ownerUserId: profile!.userId,
        memberships: {
          some: { petId: report.petId, status: "APPROVED" },
        },
      },
    });
    hasAccess = !!group;
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: "해당 알림장에 댓글을 작성할 권한이 없습니다." },
      { status: 403 }
    );
  }

  const comment = await prisma.reportComment.create({
    data: {
      reportId,
      authorUserId: profile!.userId,
      content: content.trim(),
      ...(scheduledAtDate && { scheduledAt: scheduledAtDate }),
    },
    include: { author: { select: { userId: true, name: true, role: true } } },
  });

  return NextResponse.json(comment);
}
