import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, profile: null, error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return { user, profile: null, error: NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 }) };
  }

  return { user, profile, error: null };
}

/** 프로필 없어도 에러 반환 안 함 (리다이렉트 로직용, 회원가입 미완료 사용자 허용) */
export async function getAuthUserAllowNoProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, profile: null, error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return { user, profile, error: null };
}

export async function requireAdmin() {
  const result = await getAuthUser();
  if (result.error) return result;

  if (result.profile!.role !== "ADMIN") {
    return {
      ...result,
      error: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }),
    };
  }

  return result;
}
