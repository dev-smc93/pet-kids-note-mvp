"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { MainHeader } from "@/components/layout/main-header";

interface ReportItem {
  id: string;
  content: string;
  createdAt: string;
  pet: { id: string; name: string; photoUrl: string | null };
  author: { name: string };
  isRead?: boolean;
  readAt?: string | null;
  commentCount?: number;
}

export default function ReportsPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
      return;
    }
    if (profile) {
      fetch("/api/reports")
        .then((res) => (res.ok ? res.json() : []))
        .then(setReports)
        .catch(() => setReports([]));
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MainHeader
        variant="back"
        backHref="/"
        backLabel="홈"
      />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <h1 className="mb-4 text-xl font-semibold text-zinc-900">알림장</h1>

          {reports.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center">
              <p className="text-zinc-500">
                {profile.role === "GUARDIAN"
                  ? "아직 받은 알림장이 없습니다."
                  : "작성된 알림장이 없습니다."}
              </p>
              {profile.role === "ADMIN" && (
                <Link href="/groups" className="mt-4 inline-block text-zinc-900 underline">
                  원 관리에서 알림장 작성하기
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link href={`/reports/${r.id}`}>
                    <div
                      className={`rounded-lg bg-white p-4 shadow-sm transition hover:bg-zinc-50 ${
                        profile.role === "GUARDIAN" && !r.isRead
                          ? "border-l-4 border-amber-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {r.pet.photoUrl ? (
                          <img
                            src={r.pet.photoUrl}
                            alt={r.pet.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl">
                            🐾
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-900">{r.pet.name}</span>
                            {profile.role === "GUARDIAN" && !r.isRead && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                                새 알림
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">
                            {r.content}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {r.author.name} · {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                            {r.commentCount !== undefined && r.commentCount > 0 && (
                              <> · 댓글 {r.commentCount}개</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
