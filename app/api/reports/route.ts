import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/api/auth";

const MAX_CONTENT_LENGTH = 5000;
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

  if (profile!.role === "GUARDIAN") {
    const pets = await prisma.pet.findMany({
      where: { ownerUserId: profile!.userId },
      select: { id: true },
    });
    const petIds = pets.map((p) => p.id);
    if (petIds.length === 0) {
      return NextResponse.json([]);
    }

    const reports = await prisma.report.findMany({
      where: petId ? { petId, pet: { ownerUserId: profile!.userId } } : { petId: { in: petIds } },
      include: {
        pet: {
          include: {
            memberships: {
              where: { status: "APPROVED" },
              include: { group: { select: { id: true, name: true, ownerUserId: true } } },
            },
          },
        },
        author: { select: { name: true } },
        reportReads: { where: { userId: profile!.userId }, select: { readAt: true } },
        media: { take: 1, select: { url: true } },
        _count: { select: { reportComments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = reports.map((r) => {
      const { reportReads, media, pet, _count, authorUserId, ...rest } = r;
      const group = pet.memberships.find((m) => m.group.ownerUserId === authorUserId)?.group;
      return {
        ...rest,
        pet: { id: pet.id, name: pet.name, photoUrl: pet.photoUrl },
        isRead: reportReads.length > 0,
        readAt: reportReads[0]?.readAt ?? null,
        commentCount: _count.reportComments,
        thumbnailUrl: media[0]?.url ?? null,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
      };
    });
    const filtered =
      filterGroupIds.length > 0
        ? mapped.filter((r) => r.groupId && filterGroupIds.includes(r.groupId))
        : mapped;
    return NextResponse.json(filtered);
  }

  // ADMIN
  const { profile: adminProfile, error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  const groups = await prisma.group.findMany({
    where: { ownerUserId: adminProfile!.userId },
    select: { id: true },
  });
  const adminGroupIds = groups.map((g) => g.id);
  if (adminGroupIds.length === 0) {
    return NextResponse.json([]);
  }

  const membershipGroupIds =
    filterGroupIds.length > 0
      ? filterGroupIds.filter((id) => adminGroupIds.includes(id))
      : adminGroupIds;

  const memberships = await prisma.membership.findMany({
    where: {
      groupId: { in: membershipGroupIds },
      status: "APPROVED",
    },
    select: { petId: true },
  });
  const adminPetIds = [...new Set(memberships.map((m) => m.petId))];
  if (adminPetIds.length === 0) {
    return NextResponse.json([]);
  }

  const filterPetIds = petId ? (adminPetIds.includes(petId) ? [petId] : []) : adminPetIds;
  if (filterPetIds.length === 0) {
    return NextResponse.json([]);
  }

  const reports = await prisma.report.findMany({
    where: {
      petId: { in: filterPetIds },
      ...(mineOnly ? { authorUserId: adminProfile!.userId } : {}),
    },
    include: {
      pet: {
        include: {
          owner: { select: { name: true } },
          memberships: {
            where: { status: "APPROVED" },
            include: { group: { select: { id: true, name: true, ownerUserId: true } } },
          },
        },
      },
      author: { select: { name: true } },
      reportReads: true,
      media: { take: 1, select: { url: true } },
      _count: { select: { reportComments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    reports.map((r) => {
      const { _count, reportReads, pet, media, authorUserId, ...rest } = r;
      const guardianUserId = pet.ownerUserId;
      const isReadByGuardian = reportReads.some((rr) => rr.userId === guardianUserId);
      const group = pet.memberships.find((m) => m.group.ownerUserId === authorUserId)?.group;
      return {
        ...rest,
        pet: { id: pet.id, name: pet.name, photoUrl: pet.photoUrl },
        guardianName: pet.owner.name,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
        commentCount: _count.reportComments,
        isReadByGuardian,
        thumbnailUrl: media[0]?.url ?? null,
      };
    })
  );
}

// POST: 알림장 작성 (관리자)
export async function POST(request: Request) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { petId, content, mediaUrls } = body;

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

  const membership = await prisma.membership.findFirst({
    where: {
      petId: petId.trim(),
      status: "APPROVED",
      group: { ownerUserId: profile!.userId },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "해당 반려동물에 대한 작성 권한이 없습니다." },
      { status: 403 }
    );
  }

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
    },
    include: {
      pet: { select: { id: true, name: true } },
      author: { select: { name: true } },
      media: true,
    },
  });

  return NextResponse.json(report);
}
