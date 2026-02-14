import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: { id, ownerUserId: profile!.userId },
    include: {
      memberships: {
        include: { pet: true, user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "원을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(group);
}
