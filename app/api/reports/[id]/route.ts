import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/api/auth";

const MAX_CONTENT_LENGTH = 5000;
const MAX_MEDIA = 10;

async function getReportWithAuth(reportId: string, profile: { userId: string; role: string }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      pet: true,
      author: { select: { name: true } },
      media: true,
      reportReads: true,
    },
  });
  if (!report) return null;

  if (profile.role === "ADMIN") {
    const group = await prisma.group.findFirst({
      where: {
        ownerUserId: profile.userId,
        memberships: {
          some: { petId: report.petId, status: "APPROVED" },
        },
      },
    });
    if (!group) return null;
  } else {
    if (report.pet.ownerUserId !== profile.userId) return null;
  }

  return report;
}

// GET: 알림장 상세
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;

  const report = await getReportWithAuth(id, profile!);
  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  const guardianRead = report.reportReads.find((r) => r.userId === report.pet.ownerUserId);
  const { reportReads, ...rest } = report;
  return NextResponse.json({
    ...rest,
    isRead: profile!.role === "GUARDIAN" ? !!guardianRead : undefined,
    readAt: guardianRead?.readAt ?? null,
  });
}

// PATCH: 알림장 수정 (관리자)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const report = await getReportWithAuth(id, profile!);
  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const { content, mediaUrls } = body;

  const data: { content?: string; media?: object } = {};

  if (typeof content === "string") {
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `내용은 ${MAX_CONTENT_LENGTH}자 이하여야 합니다.` },
        { status: 400 }
      );
    }
    data.content = content.trim();
  }

  if (Array.isArray(mediaUrls)) {
    const urls = mediaUrls.filter((u: unknown) => typeof u === "string" && u.trim());
    if (urls.length > 0 && (urls.length < 1 || urls.length > MAX_MEDIA)) {
      return NextResponse.json(
        { error: `사진은 1~${MAX_MEDIA}장까지 첨부 가능합니다.` },
        { status: 400 }
      );
    }
    data.media = {
      deleteMany: {},
      ...(urls.length > 0 && {
        create: urls.map((url: string) => ({ url, type: "image" })),
      }),
    };
  }

  const updated = await prisma.report.update({
    where: { id },
    data,
    include: {
      pet: { select: { id: true, name: true } },
      author: { select: { name: true } },
      media: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE: 알림장 삭제 (관리자)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const report = await getReportWithAuth(id, profile!);
  if (!report) {
    return NextResponse.json({ error: "알림장을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
