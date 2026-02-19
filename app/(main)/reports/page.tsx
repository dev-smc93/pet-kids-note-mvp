"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

interface ReportItem {
  id: string;
  content: string;
  createdAt: string;
  pet: { id: string; name: string; photoUrl: string | null };
  author: { name: string };
  authorUserId?: string;
  isGuardianPost?: boolean;
  isRead?: boolean;
  readAt?: string | null;
  commentCount?: number;
  /** 관리자용: 보호자 읽음 여부 */
  isReadByGuardian?: boolean;
  /** 관리자용: 관리자 본인 읽음 여부 */
  isReadByAdmin?: boolean;
  /** 관리자용: 보호자 이름 */
  guardianName?: string;
  /** 관리자용: 알림장 작성한 원 명칭 */
  groupName?: string | null;
  /** 목록 썸네일 (첫 번째 미디어) */
  thumbnailUrl?: string | null;
}

const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

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
  const searchParams = useSearchParams();
  const groupIdsParam = searchParams.get("groupIds");
  const groupIdParam = searchParams.get("groupId");
  const groupIds = groupIdsParam
    ? groupIdsParam.split(",").filter(Boolean)
    : groupIdParam
      ? [groupIdParam]
      : [];
  const mineOnly = searchParams.get("mineOnly") === "true";
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const listScrollRef = useRef<HTMLUListElement>(null);

  const checkScrollArrow = useCallback(() => {
    const el = listScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    const scrolled = el.scrollTop > 20;
    setShowScrollArrow(hasOverflow && !scrolled);
  }, []);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
      return;
    }
    if (profile) {
      setIsLoadingReports(true);
      const params = new URLSearchParams();
      if (groupIds.length > 0) params.set("groupIds", groupIds.join(","));
      if (mineOnly) params.set("mineOnly", "true");
      const url = `/api/reports${params.toString() ? `?${params.toString()}` : ""}`;
      fetch(url)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: ReportItem[]) => {
          setReports(data);
          const months = getMonthsFromReports(data);
          if (months.length > 0) {
            setSelectedMonth((prev) => (months.includes(prev) ? prev : months[0]));
          }
        })
        .catch(() => setReports([]))
        .finally(() => setIsLoadingReports(false));
    } else {
      setIsLoadingReports(false);
    }
  }, [profile, isLoading, router, groupIds.join(","), mineOnly]);

  const months = getMonthsFromReports(reports);
  const [year, month] = selectedMonth ? selectedMonth.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const filteredReports = reports.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  useEffect(() => {
    if (filteredReports.length === 0) return;
    checkScrollArrow();
    const t1 = setTimeout(checkScrollArrow, 100);
    const t2 = setTimeout(checkScrollArrow, 300);
    const el = listScrollRef.current;
    if (el) {
      const ro = new ResizeObserver(checkScrollArrow);
      ro.observe(el);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        ro.disconnect();
      };
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [filteredReports.length, selectedMonth, checkScrollArrow]);

  const handleScrollDown = () => {
    const el = listScrollRef.current;
    if (!el) return;
    el.scrollBy({ top: el.clientHeight * 0.8, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!profile) return null;

  if (isLoadingReports) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">알림장(목록)</h1>
          <Link
            href="/reports/filter"
            className="flex h-10 w-10 items-center justify-center rounded border-2 border-red-400 text-white"
            aria-label="필터"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center bg-zinc-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </main>
      </div>
    );
  }

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
        <h1 className="text-lg font-semibold text-white">알림장(목록)</h1>
        <Link
          href={
            groupIds.length > 0 || mineOnly
              ? `/reports/filter?${new URLSearchParams({
                  ...(groupIds.length > 0 ? { groupIds: groupIds.join(",") } : {}),
                  ...(mineOnly ? { mineOnly: "true" } : {}),
                }).toString()}`
              : "/reports/filter"
          }
          className="flex h-10 w-10 items-center justify-center rounded border-2 border-red-400 text-white"
          aria-label="필터"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </Link>
      </header>

      <main className="flex min-h-0 flex-1 flex-col bg-zinc-50 px-4 py-4">
        <div className="mx-auto flex max-w-md flex-1 flex-col overflow-hidden">
          {/* 월 선택 */}
          <div className="relative mb-4 shrink-0">
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
            <div className="flex flex-1 flex-col items-center justify-center py-16">
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
            <div className="relative min-h-0 flex-1">
              <ul
                ref={listScrollRef}
                onScroll={checkScrollArrow}
                className="scrollbar-hide min-h-0 max-h-[80vh] space-y-3 overflow-y-auto overflow-x-hidden"
              >
              {filteredReports.map((r) => {
                const d = new Date(r.createdAt);
                const dateNum = d.getDate();
                const dayName = DAY_NAMES[d.getDay()];
                return (
                  <li key={r.id}>
                    <Link href={`/reports/${r.id}`}>
                      <div
                        className={`flex gap-4 rounded-lg p-4 shadow-sm transition ${
                          (profile.role === "GUARDIAN" && !r.isRead && !r.isGuardianPost) ||
                          (profile.role === "ADMIN" && r.isReadByAdmin === false && r.authorUserId !== profile?.userId)
                            ? "bg-amber-50 hover:bg-amber-100"
                            : "bg-white hover:bg-zinc-50"
                        } ${(profile.role === "GUARDIAN" && !r.isRead && !r.isGuardianPost) || (profile.role === "ADMIN" && r.isReadByAdmin === false && r.authorUserId !== profile?.userId) ? "border-l-4 border-amber-500" : ""}`}
                      >
                        {/* 좌측: 날짜, 요일 */}
                        <div className="flex shrink-0 flex-col items-center border-r border-zinc-100 pr-4">
                          <span className="text-2xl font-semibold text-zinc-400">{dateNum}</span>
                          <span className="text-xs text-zinc-400">{dayName}</span>
                        </div>
                        {/* 우측: 수신자, 내용, 미수신, 썸네일 */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900">
                            {r.isGuardianPost
                              ? `${r.pet.name} · 보호자의 글`
                              : `${r.groupName ? `${r.groupName} · ` : ""}${r.pet.name}${profile.role === "ADMIN" && r.guardianName ? ` | ${r.guardianName}` : ""}`}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">{r.content}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            {profile.role === "GUARDIAN" && !r.isRead && !r.isGuardianPost && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                                새 알림
                              </span>
                            )}
                            {profile.role === "ADMIN" && r.isReadByAdmin === false && r.authorUserId !== profile?.userId && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                                새 알림
                              </span>
                            )}
                            {profile.role === "ADMIN" && r.isReadByGuardian === false && !r.isGuardianPost && (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="shrink-0"
                                >
                                  <rect width="20" height="16" x="2" y="4" rx="2" />
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                보호자 미수신
                              </span>
                            )}
                            {r.commentCount !== undefined && r.commentCount > 0 && (
                              <span className="text-xs text-zinc-400">댓글 {r.commentCount}개</span>
                            )}
                          </div>
                        </div>
                        {/* 썸네일 */}
                        {r.thumbnailUrl && (
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                            <img
                              src={r.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
              </ul>
              {showScrollArrow && (
                <button
                  type="button"
                  onClick={handleScrollDown}
                  className="absolute bottom-3 left-1/2 z-10 animate-bounce-down rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
                  aria-label="아래로 스크롤"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-600"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FAB: 관리자 + 보호자 표시 */}
      {(profile.role === "ADMIN" || profile.role === "GUARDIAN") && (
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
