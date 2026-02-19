import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

/** GET: 보호자/관리자용 미확인 알림장 개수 */
export async function GET() {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  if (profile!.role === "GUARDIAN") {
    const pets = await prisma.pet.findMany({
      where: { ownerUserId: profile!.userId },
      select: { id: true },
    });
    const petIds = pets.map((p) => p.id);
    if (petIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }
    const count = await prisma.report.count({
      where: {
        petId: { in: petIds },
        authorUserId: { not: profile!.userId },
        reportReads: { none: { userId: profile!.userId } },
      },
    });
    return NextResponse.json({ count });
  }

  if (profile!.role === "ADMIN") {
    const groups = await prisma.group.findMany({
      where: { ownerUserId: profile!.userId },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);
    if (groupIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }
    const memberships = await prisma.membership.findMany({
      where: { groupId: { in: groupIds }, status: "APPROVED" },
      select: { petId: true },
    });
    const petIds = [...new Set(memberships.map((m) => m.petId))];
    if (petIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }
    const count = await prisma.report.count({
      where: {
        petId: { in: petIds },
        authorUserId: { not: profile!.userId },
        reportReads: { none: { userId: profile!.userId } },
      },
    });
    return NextResponse.json({ count });
  }

  return NextResponse.json({ count: 0 });
}
