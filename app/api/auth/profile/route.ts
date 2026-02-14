import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "프로필 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, groupName, sido, sigungu, address } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "닉네임은 필수입니다." },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "GUARDIAN"];
    const profileRole = validRoles.includes(role) ? role : "GUARDIAN";

    if (profileRole === "ADMIN") {
      if (!groupName || typeof groupName !== "string" || groupName.trim().length === 0) {
        return NextResponse.json(
          { error: "원 이름을 입력해주세요." },
          { status: 400 }
        );
      }
      if (!sido || typeof sido !== "string" || sido.trim().length === 0) {
        return NextResponse.json(
          { error: "시/도를 입력해주세요." },
          { status: 400 }
        );
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: name.trim(),
        role: profileRole,
      },
      update: {
        name: name.trim(),
        role: profileRole,
      },
    });

    if (profileRole === "ADMIN" && groupName && sido) {
      const existingGroup = await prisma.group.findFirst({
        where: { ownerUserId: user.id },
      });
      if (!existingGroup) {
        await prisma.group.create({
          data: {
            name: groupName.trim(),
            ownerUserId: user.id,
            sido: (sido || "").trim(),
            sigungu: typeof sigungu === "string" ? sigungu.trim() : "",
            address: typeof address === "string" ? address.trim() : "",
          },
        });
      }
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json(
      { error: "프로필 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
