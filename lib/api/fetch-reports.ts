import { prisma } from "@/lib/prisma";
import type { Profile } from "@prisma/client";

export interface FetchReportsParams {
  petId?: string;
  groupIds?: string[];
  mineOnly?: boolean;
}

export async function fetchReportsList(
  profile: Profile,
  params: FetchReportsParams = {}
) {
  const { petId, groupIds: filterGroupIds = [], mineOnly = false } = params;

  if (profile.role === "GUARDIAN") {
    const pets = await prisma.pet.findMany({
      where: { ownerUserId: profile.userId },
      select: { id: true },
    });
    const petIds = pets.map((p) => p.id);
    if (petIds.length === 0) return [];

    const reports = await prisma.report.findMany({
      where: {
        ...(petId ? { petId, pet: { ownerUserId: profile.userId } } : { petId: { in: petIds } }),
        ...(mineOnly ? { authorUserId: profile.userId } : {}),
      },
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
        reportReads: { where: { userId: profile.userId }, select: { readAt: true } },
        media: { take: 1, select: { url: true } },
        _count: { select: { reportComments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = reports.map((r) => {
      const { reportReads, media, pet, _count, authorUserId, ...rest } = r;
      const group = pet.memberships.find((m) => m.group.ownerUserId === authorUserId)?.group;
      const isGuardianPost = authorUserId === pet.ownerUserId;
      return {
        ...rest,
        authorUserId,
        isGuardianPost,
        pet: { id: pet.id, name: pet.name, photoUrl: pet.photoUrl },
        isRead: reportReads.length > 0,
        readAt: reportReads[0]?.readAt ?? null,
        commentCount: _count.reportComments,
        thumbnailUrl: media[0]?.url ?? null,
        groupName: group?.name ?? null,
        groupId: group?.id ?? null,
      };
    });
    return filterGroupIds.length > 0
      ? mapped.filter((r) => r.groupId && filterGroupIds.includes(r.groupId))
      : mapped;
  }

  // ADMIN
  const groups = await prisma.group.findMany({
    where: { ownerUserId: profile.userId },
    select: { id: true },
  });
  const adminGroupIds = groups.map((g) => g.id);
  if (adminGroupIds.length === 0) return [];

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
  if (adminPetIds.length === 0) return [];

  const filterPetIds = petId ? (adminPetIds.includes(petId) ? [petId] : []) : adminPetIds;
  if (filterPetIds.length === 0) return [];

  const reports = await prisma.report.findMany({
    where: {
      petId: { in: filterPetIds },
      ...(mineOnly ? { authorUserId: profile.userId } : {}),
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

  return reports.map((r) => {
    const { _count, reportReads, pet, media, authorUserId, ...rest } = r;
    const guardianUserId = pet.ownerUserId;
    const isReadByGuardian = reportReads.some((rr) => rr.userId === guardianUserId);
    const isReadByAdmin = reportReads.some((rr) => rr.userId === profile.userId);
    const group = pet.memberships.find((m) => m.group.ownerUserId === authorUserId)?.group;
    const isGuardianPost = authorUserId === pet.ownerUserId;
    return {
      ...rest,
      authorUserId,
      isGuardianPost,
      pet: { id: pet.id, name: pet.name, photoUrl: pet.photoUrl },
      guardianName: pet.owner.name,
      groupName: group?.name ?? null,
      groupId: group?.id ?? null,
      commentCount: _count.reportComments,
      isReadByGuardian,
      isReadByAdmin,
      thumbnailUrl: media[0]?.url ?? null,
    };
  });
}
