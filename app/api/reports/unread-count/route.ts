import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

/** GET: 보호자용 미확인 알림장 개수 */
export async function GET() {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  if (profile!.role !== "GUARDIAN") {
    return NextResponse.json({ count: 0 });
  }

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
      reportReads: {
        none: { userId: profile!.userId },
      },
    },
  });

  return NextResponse.json({ count });
}
