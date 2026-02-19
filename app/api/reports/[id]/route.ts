import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/api/auth";

const MAX_CONTENT_LENGTH = 5000;

const VALID_DAILY_RECORD = {
  mood: ["GOOD", "NORMAL", "BAD"],
  health: ["GOOD", "NORMAL", "BAD"],
  temperatureCheck: ["NORMAL", "LOW_FEVER", "HIGH_FEVER"],
  mealStatus: ["NORMAL_AMOUNT", "A_LOT", "A_LITTLE", "NONE"],
  sleepTime: ["NONE", "UNDER_1H", "1H_1H30", "1H30_2H", "OVER_2H"],
  bowelStatus: ["NORMAL", "HARD", "LOOSE", "DIARRHEA", "NONE"],
} as const;

function sanitizeDailyRecord(dr: unknown): Record<string, string> | null {
  if (!dr || typeof dr !== "object") return null;
  const obj = dr as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [key, validValues] of Object.entries(VALID_DAILY_RECORD)) {
    const val = obj[key];
    if (typeof val === "string" && (validValues as readonly string[]).includes(val)) {
      result[key] = val;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}
const MAX_MEDIA = 10;

async function getReportWithAuth(reportId: string, profile: { userId: string; role: string }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      pet: true,
      author: { select: { name: true } },
      media: true,
      reportReads: true,
      dailyRecord: true,
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
  const adminRead = report.reportReads.find((r) => r.userId === profile!.userId);
  const isGuardianPost = report.authorUserId === report.pet.ownerUserId;
  const { reportReads, ...rest } = report;
  return NextResponse.json({
    ...rest,
    isGuardianPost,
    isRead:
      profile!.role === "GUARDIAN"
        ? !!guardianRead
        : profile!.role === "ADMIN"
          ? !!adminRead
          : undefined,
    readAt:
      profile!.role === "GUARDIAN"
        ? guardianRead?.readAt ?? null
        : profile!.role === "ADMIN"
          ? adminRead?.readAt ?? null
          : null,
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
  if (report.authorUserId === report.pet.ownerUserId) {
    return NextResponse.json(
      { error: "보호자가 작성한 글은 수정할 수 없습니다." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { content, mediaUrls, dailyRecord } = body;

  const data: { content?: string; media?: object; dailyRecord?: object } = {};

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

  const dr = sanitizeDailyRecord(dailyRecord);
  if (dailyRecord !== undefined) {
    if (dr) {
      data.dailyRecord = {
        upsert: {
          create: dr,
          update: dr,
        },
      };
    } else {
      data.dailyRecord = { delete: true };
    }
  }

  const updated = await prisma.report.update({
    where: { id },
    data,
    include: {
      pet: { select: { id: true, name: true } },
      author: { select: { name: true } },
      media: true,
      dailyRecord: true,
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
  if (report.authorUserId === report.pet.ownerUserId) {
    return NextResponse.json(
      { error: "보호자가 작성한 글은 삭제할 수 없습니다." },
      { status: 403 }
    );
  }

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
