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
      active: true,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");
  const active = searchParams.get("active");

  if (!endpoint || !endpoint.trim()) {
    return NextResponse.json(
      { error: "endpoint가 필요합니다." },
      { status: 400 }
    );
  }

  const trimmedEndpoint = endpoint.trim();

  // 로그아웃 시: active=false로 비활성화 (구독 유지, 푸시 미발송)
  if (active === "false") {
    await prisma.pushSubscription.updateMany({
      where: { userId: profile!.userId, endpoint: trimmedEndpoint },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
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

  // 사용자가 "알림 해제" 클릭 시: 완전 삭제
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: endpoint.trim() },
  });

  return NextResponse.json({ success: true });
}
