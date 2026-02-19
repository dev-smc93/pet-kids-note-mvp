"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

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

function getMonthsFromReports(reports: ReportItem[]) {
  const set = new Set<string>();
  reports.forEach((r) => {
    const d = new Date(r.createdAt);
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  });
  return Array.from(set).sort().reverse();
}

export default function ReportsPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
      return;
    }
    if (profile) {
      fetch("/api/reports")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: ReportItem[]) => {
          setReports(data);
          const months = getMonthsFromReports(data);
          if (months.length > 0) {
            setSelectedMonth((prev) => (months.includes(prev) ? prev : months[0]));
          }
        })
        .catch(() => setReports([]));
    }
  }, [profile, isLoading, router]);

  const months = getMonthsFromReports(reports);
  const [year, month] = selectedMonth ? selectedMonth.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const filteredReports = reports.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!profile) return null;

  const hasReportsInOtherMonths = reports.length > 0 && filteredReports.length === 0;
  const emptyMessage = hasReportsInOtherMonths
    ? "해당 월에 알림장이 없습니다."
    : profile.role === "GUARDIAN"
      ? "아직 받은 알림장이 없습니다."
      : "작성된 알림장이 없습니다.";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 헤더: 빨간색 배경 (상단 갈색 띠 없음) */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
        <Link href="/" className="flex h-10 w-10 items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-white">알림장</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded border-2 border-red-400 text-white"
          aria-label="정렬"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
      </header>

      <main className="flex-1 bg-zinc-50 px-4 py-4">
        <div className="mx-auto max-w-md">
          {/* 월 선택 */}
          <div className="relative mb-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-base text-zinc-900 focus:border-zinc-400 focus:outline-none"
            >
              {(months.length > 0 ? months : [defaultMonth]).map((m) => {
                const [y, mo] = m.split("-").map(Number);
                return (
                  <option key={m} value={m}>
                    {y}년 {mo}월
                  </option>
                );
              })}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-zinc-400"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <p className="text-zinc-500">{emptyMessage}</p>
              {profile.role === "ADMIN" && !hasReportsInOtherMonths && (
                <Link href="/groups" className="mt-4 text-sm text-zinc-600 underline">
                  원 관리에서 알림장 작성하기
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredReports.map((r) => (
                <li key={r.id}>
                  <Link href={`/reports/${r.id}`}>
                    <div
                      className={`rounded-lg bg-white p-4 shadow-sm transition hover:bg-zinc-50 ${
                        profile.role === "GUARDIAN" && !r.isRead ? "border-l-4 border-amber-500" : ""
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
                          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">{r.content}</p>
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

      {/* FAB: 관리자만 표시 */}
      {profile.role === "ADMIN" && (
        <Link
          href="/reports/new"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-95"
          aria-label="알림장 작성"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </Link>
      )}
    </div>
  );
}
