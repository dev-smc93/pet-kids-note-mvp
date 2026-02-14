import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

export async function GET() {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const memberships = await prisma.membership.findMany({
    where: { userId: profile!.userId },
    include: {
      group: true,
      pet: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(memberships);
}
