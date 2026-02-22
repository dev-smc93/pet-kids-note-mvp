import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

export async function getHomeData() {
  const { profile, error } = await getAuthUser();
  if (error || !profile) {
    return { profile: null, groupCount: 0, unreadCount: 0, error };
  }

  let groupCount = 0;
  let unreadCount = 0;

  if (profile.role === "ADMIN") {
    const groups = await prisma.group.findMany({
      where: { ownerUserId: profile.userId },
      select: { id: true },
    });
    groupCount = groups.length;
    const groupIds = groups.map((g) => g.id);
    if (groupIds.length > 0) {
      const memberships = await prisma.membership.findMany({
        where: { groupId: { in: groupIds }, status: "APPROVED" },
        select: { petId: true },
      });
      const petIds = [...new Set(memberships.map((m) => m.petId))];
      if (petIds.length > 0) {
        unreadCount = await prisma.report.count({
          where: {
            petId: { in: petIds },
            authorUserId: { not: profile.userId },
            reportReads: { none: { userId: profile.userId } },
          },
        });
      }
    }
  } else if (profile.role === "GUARDIAN") {
    const pets = await prisma.pet.findMany({
      where: { ownerUserId: profile.userId },
      select: { id: true },
    });
    const petIds = pets.map((p) => p.id);
    if (petIds.length > 0) {
      unreadCount = await prisma.report.count({
        where: {
          petId: { in: petIds },
          authorUserId: { not: profile.userId },
          reportReads: { none: { userId: profile.userId } },
        },
      });
    }
  }

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      role: profile.role,
      name: profile.name,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    groupCount,
    unreadCount,
    error: null,
  };
}
