"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

interface GroupOption {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  address: string;
}

export default function ReportsFilterPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdsParam = searchParams.get("groupIds");
  const groupIdParam = searchParams.get("groupId");

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() =>
    groupIdsParam
      ? groupIdsParam.split(",").filter(Boolean)
      : groupIdParam
        ? [groupIdParam]
        : []
  );
  const [mineOnly, setMineOnly] = useState(() => searchParams.get("mineOnly") === "true");

  useEffect(() => {
    const ids = groupIdsParam
      ? groupIdsParam.split(",").filter(Boolean)
      : groupIdParam
        ? [groupIdParam]
        : [];
    setSelectedGroupIds(ids);
    setMineOnly(searchParams.get("mineOnly") === "true");
  }, [groupIdsParam, groupIdParam, searchParams]);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
      return;
    }
    if (profile?.role === "ADMIN") {
      fetch("/api/groups")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: GroupOption[]) => setGroups(data))
        .catch(() => setGroups([]));
    } else if (profile?.role === "GUARDIAN") {
      fetch("/api/memberships")
        .then((res) => (res.ok ? res.json() : []))
        .then((memberships: { group: GroupOption; status: string }[]) => {
          const approved = memberships.filter((m) => m.status === "APPROVED");
          const uniqueGroups = Array.from(
            new Map(approved.map((m) => [m.group.id, m.group])).values()
          );
          setGroups(uniqueGroups);
        })
        .catch(() => setGroups([]));
    }
  }, [profile, isLoading, router]);

  const handleApply = () => {
    const params = new URLSearchParams();
    if (selectedGroupIds.length > 0) params.set("groupIds", selectedGroupIds.join(","));
    if (profile?.role === "ADMIN" && mineOnly) params.set("mineOnly", "true");
    router.push(`/reports${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedGroupIds(groups.map((g) => g.id));
  const clearAll = () => setSelectedGroupIds([]);

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
        <Link
          href="/reports"
          className="flex h-10 w-10 items-center justify-center text-white"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-white">필터</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium text-zinc-700">원 선택</h2>
            <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  선택 해제
                </button>
              </div>
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.includes(g.id)}
                    onChange={() => toggleGroup(g.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-red-500 focus:ring-red-500"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-900">{g.name}</span>
                    <p className="text-xs text-zinc-500">
                      {g.sido} {g.sigungu} {g.address}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {profile?.role === "ADMIN" && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-zinc-700">보기 옵션</h2>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <span className="font-medium text-zinc-900">내가 쓴 글만 보기</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={mineOnly}
                  onClick={() => setMineOnly((prev) => !prev)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    mineOnly ? "bg-red-500" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      mineOnly ? "left-1 translate-x-5" : "left-1"
                    }`}
                  />
                </button>
              </label>
            </section>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-lg bg-red-500 py-3 font-medium text-white transition hover:bg-red-600"
          >
            적용
          </button>
        </div>
      </main>
    </div>
  );
}
