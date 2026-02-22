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

  const trimmedEndpoint = endpoint.trim();

  // 동일 endpoint는 한 기기당 한 사용자만 (다른 계정 알림 수신 방지)
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: trimmedEndpoint },
  });

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: profile!.userId,
        endpoint: trimmedEndpoint,
      },
    },
    create: {
      userId: profile!.userId,
      endpoint: trimmedEndpoint,
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

  if (!endpoint || !endpoint.trim()) {
    return NextResponse.json(
      { error: "endpoint가 필요합니다." },
      { status: 400 }
    );
  }

  // endpoint 기준 삭제 (동일 기기에서 이전 계정 구독이 남아있을 수 있음)
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: endpoint.trim() },
  });

  return NextResponse.json({ success: true });
}
