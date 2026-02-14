"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/layout/main-header";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [groupCount, setGroupCount] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.role === "ADMIN") {
      fetch("/api/groups")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setGroupCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setGroupCount(0));
    }
  }, [profile?.role]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MainHeader variant="home" />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md space-y-4">
          {user && profile && (
            <>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-zinc-600">
                      안녕하세요, <strong>{profile.name}</strong>님
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {profile.role === "ADMIN"
                        ? groupCount !== null && groupCount > 0
                          ? `${groupCount}개 원 관리자`
                          : "관리자"
                        : "보호자"}
                    </p>
                  </div>
                  <Link href="/auth/profile">
                    <Button variant="outline" size="sm">
                      프로필 수정
                    </Button>
                  </Link>
                </div>
              </div>

              {profile.role === "ADMIN" && (
                <div className="space-y-3">
                  <Link href="/groups" className="block">
                    <div className="rounded-lg bg-white p-4 shadow-sm transition hover:bg-zinc-50">
                      <h2 className="font-medium text-zinc-900">원 관리</h2>
                      <p className="text-sm text-zinc-500">
                        원 생성, 연결 승인/거절
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {profile.role === "GUARDIAN" && (
                <div className="space-y-3">
                  <Link href="/my-pets" className="block">
                    <div className="rounded-lg bg-white p-4 shadow-sm transition hover:bg-zinc-50">
                      <h2 className="font-medium text-zinc-900">내 반려동물</h2>
                      <p className="text-sm text-zinc-500">
                        반려동물 등록, 연결된 원 목록
                      </p>
                    </div>
                  </Link>
                  <Link href="/search-centers" className="block">
                    <div className="rounded-lg border-2 border-dashed border-zinc-300 p-4 transition hover:border-zinc-400 hover:bg-zinc-50">
                      <h2 className="font-medium text-zinc-900">
                        + 원 검색
                      </h2>
                      <p className="text-sm text-zinc-500">
                        시/도로 원을 검색해 연결 요청
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
