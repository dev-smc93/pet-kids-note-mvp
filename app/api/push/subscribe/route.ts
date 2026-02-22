import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

export async function POST(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const { endpoint, keys } = body;

  if (
    !endpoint ||
    typeof endpoint !== "string" ||
    !keys ||
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string"
  ) {
    return NextResponse.json(
      { error: "구독 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: profile!.userId,
        endpoint: endpoint.trim(),
      },
    },
    create: {
      userId: profile!.userId,
      endpoint: endpoint.trim(),
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint가 필요합니다." },
      { status: 400 }
    );
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: profile!.userId,
      endpoint,
    },
  });

  return NextResponse.json({ success: true });
}
