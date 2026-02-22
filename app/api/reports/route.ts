import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";
import { sendPushToUser } from "@/lib/push/send-push";
import { fetchReportsList } from "@/lib/api/fetch-reports";

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

// GET: 알림장 목록 (보호자: 내 반려동물 / 관리자: 내 원의 반려동물)
export async function GET(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");
  const groupIdParam = searchParams.get("groupId");
  const groupIdsParam = searchParams.get("groupIds");
  const filterGroupIds = groupIdsParam
    ? groupIdsParam.split(",").filter(Boolean)
    : groupIdParam
      ? [groupIdParam]
      : [];
  const mineOnly = searchParams.get("mineOnly") === "true";

  const reports = await fetchReportsList(profile!, {
    petId: petId ?? undefined,
    groupIds: filterGroupIds,
    mineOnly,
  });
  return NextResponse.json(reports, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}

// POST: 알림장 작성 (관리자 + 보호자, 보호자는 생활기록 제외)
export async function POST(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const { petId, content, mediaUrls, dailyRecord } = body;

  if (!petId || typeof petId !== "string" || !petId.trim()) {
    return NextResponse.json(
      { error: "대상 반려동물을 선택해주세요." },
      { status: 400 }
    );
  }

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "내용을 입력해주세요." },
      { status: 400 }
    );
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `내용은 ${MAX_CONTENT_LENGTH}자 이하여야 합니다.` },
      { status: 400 }
    );
  }

  const urls = Array.isArray(mediaUrls)
    ? mediaUrls.filter((u: unknown) => typeof u === "string" && u.trim())
    : [];
  if (urls.length > 0 && (urls.length < 1 || urls.length > MAX_MEDIA)) {
    return NextResponse.json(
      { error: `사진은 1~${MAX_MEDIA}장까지 첨부 가능합니다.` },
      { status: 400 }
    );
  }

  const membership =
    profile!.role === "ADMIN"
      ? await prisma.membership.findFirst({
          where: {
            petId: petId.trim(),
            status: "APPROVED",
            group: { ownerUserId: profile!.userId },
          },
        })
      : await prisma.membership.findFirst({
          where: {
            petId: petId.trim(),
            userId: profile!.userId,
            status: "APPROVED",
          },
        });

  if (!membership) {
    return NextResponse.json(
      { error: "해당 반려동물에 대한 작성 권한이 없습니다." },
      { status: 403 }
    );
  }

  const dr =
    profile!.role === "ADMIN" ? sanitizeDailyRecord(dailyRecord) : null;

  const report = await prisma.report.create({
    data: {
      petId: petId.trim(),
      authorUserId: profile!.userId,
      content: content.trim(),
      media:
        urls.length > 0
          ? {
              create: urls.map((url: string) => ({ url, type: "image" })),
            }
          : undefined,
      dailyRecord: dr ? { create: dr } : undefined,
      reportReads:
        profile!.role === "ADMIN"
          ? { create: { userId: profile!.userId } }
          : undefined,
    },
    include: {
      pet: { select: { id: true, name: true, ownerUserId: true } },
      author: { select: { name: true } },
      media: true,
    },
  });

  const guardianUserId = report.pet.ownerUserId;
  if (guardianUserId !== profile!.userId) {
    sendPushToUser(guardianUserId, {
      title: "새 알림장이 등록되었습니다",
      body: `${report.pet.name} - ${report.author.name}`,
      url: `/reports/${report.id}`,
    }).catch(() => {});
  }

  return NextResponse.json(report);
}
