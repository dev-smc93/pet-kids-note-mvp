"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-zinc-900">반려동물 알림장</h1>
        <div className="flex items-center gap-2">
          {profile && (
            <span className="text-sm text-zinc-600">{profile.name}</span>
          )}
          <Button variant="ghost" onClick={() => signOut()} className="text-sm">
            로그아웃
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          {user && profile && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-zinc-600">
                안녕하세요, <strong>{profile.name}</strong>님 ({profile.role})
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                알림장 기능은 B단계에서 구현됩니다.
              </p>
              <Link
                href="/auth/profile"
                className="mt-4 inline-block text-sm font-medium text-zinc-900 underline"
              >
                프로필 수정
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
