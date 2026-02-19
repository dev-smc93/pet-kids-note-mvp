"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { ReportForm } from "@/components/reports/report-form";

interface PetOption {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
  ownerName?: string;
}

interface GroupOption {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  address: string;
  membershipCounts?: { approved: number; pending: number; rejected: number };
}

interface GroupDetailData {
  id: string;
  memberships: { pet: PetOption; user?: { name: string }; status: string }[];
}

export default function ReportNewPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetailData | null>(null);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guardianGroupPets, setGuardianGroupPets] = useState<Record<string, PetOption[]>>({});
  const isAdmin = profile?.role === "ADMIN";
  const isGuardian = profile?.role === "GUARDIAN";

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
      return;
    }
    if (profile && (isAdmin || isGuardian)) {
      setIsLoadingGroups(true);
      if (isAdmin) {
        fetch("/api/groups")
          .then((res) => (res.ok ? res.json() : []))
          .then((data: GroupOption[]) =>
            setGroups(data.filter((g) => (g.membershipCounts?.approved ?? 0) > 0))
          )
          .catch(() => setGroups([]))
          .finally(() => setIsLoadingGroups(false));
      } else {
        fetch("/api/memberships")
          .then((res) => (res.ok ? res.json() : []))
          .then((data: { group: GroupOption; pet: PetOption; status: string }[]) => {
            const approved = data.filter((m) => m.status === "APPROVED");
            const byGroup = new Map<string, { group: GroupOption; pets: PetOption[] }>();
            for (const m of approved) {
              const g = m.group;
              if (!byGroup.has(g.id)) {
                byGroup.set(g.id, { group: g, pets: [] });
              }
              byGroup.get(g.id)!.pets.push(m.pet);
            }
            const groupList = Array.from(byGroup.values()).map(({ group, pets }) => ({
              ...group,
              membershipCounts: { approved: pets.length, pending: 0, rejected: 0 },
            }));
            const petsMap: Record<string, PetOption[]> = {};
            byGroup.forEach(({ group, pets }) => {
              petsMap[group.id] = pets;
            });
            setGroups(groupList);
            setGuardianGroupPets(petsMap);
          })
          .catch(() => {
            setGroups([]);
            setGuardianGroupPets({});
          })
          .finally(() => setIsLoadingGroups(false));
      }
    } else {
      setIsLoadingGroups(false);
    }
  }, [profile, isLoading, router, isAdmin, isGuardian]);

  useEffect(() => {
    if (selectedGroupId && isAdmin) {
      setIsLoadingGroupDetail(true);
      fetch(`/api/groups/${selectedGroupId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setGroupDetail)
        .catch(() => setGroupDetail(null))
        .finally(() => setIsLoadingGroupDetail(false));
    } else if (selectedGroupId && isGuardian) {
      const pets = guardianGroupPets[selectedGroupId] ?? [];
      setGroupDetail({
        id: selectedGroupId,
        memberships: pets.map((pet) => ({ pet, status: "APPROVED" })),
      });
      setIsLoadingGroupDetail(false);
    } else {
      setGroupDetail(null);
      setIsLoadingGroupDetail(false);
    }
  }, [selectedGroupId, isAdmin, isGuardian, guardianGroupPets]);

  if (isLoading || !profile || (profile.role !== "ADMIN" && profile.role !== "GUARDIAN")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!selectedGroupId && isLoadingGroups) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
          <Link href="/reports" className="flex h-10 w-10 items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">알림장 작성(원 선택)</h1>
          <div className="h-10 w-10" />
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            <p className="text-sm text-zinc-500">불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  const approvedPets =
    groupDetail?.memberships
      .filter((m) => m.status === "APPROVED")
      .map((m) => ({ ...m.pet, ownerName: m.user?.name ?? "" })) ?? [];

  const selectedGroupName = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)?.name ?? ""
    : "";
  const headerTitle = selectedGroupName
    ? `알림장 작성 - ${selectedGroupName}`
    : "알림장 작성(원 선택)";

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="mt-4 text-sm font-medium text-zinc-600">등록 중...</p>
        </div>
      )}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-red-500 px-4 py-3">
        <Link href="/reports" className="flex h-10 w-10 shrink-0 items-center justify-center text-white">
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
        <h1 className="min-w-0 flex-1 truncate text-center text-lg font-semibold text-white">
          {headerTitle}
        </h1>
        <div className="h-10 w-10 shrink-0" />
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          {!selectedGroupId ? (
            <>
              <p className="mb-4 text-sm text-zinc-600">
                알림장을 작성할 원을 선택해주세요.
              </p>
              {groups.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center">
                  <p className="text-zinc-600">
                    {isAdmin ? "연결된 반려동물이 있는 원이 없습니다." : "연결된 원이 없습니다."}
                  </p>
                  <Link
                    href={isAdmin ? "/groups" : "/search-centers"}
                    className="mt-4 inline-block text-zinc-900 underline"
                  >
                    {isAdmin ? "원 관리에서 반려동물 연결하기" : "원 검색에서 연결 요청하기"}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedGroupId(g.id)}
                        className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:bg-zinc-50"
                      >
                        <p className="font-medium text-zinc-900">{g.name}</p>
                        <p className="mt-0.5 text-sm text-zinc-500">
                          {g.sido} {g.sigungu} {g.address}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          연결된 반려동물 {g.membershipCounts?.approved ?? 0}마리
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : groupDetail ? (
            <div className="space-y-4">
              <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                  className="flex-1 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                >
                  다른 원 선택
                </button>
                <button
                  type="submit"
                  form="report-form"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-1.5 bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                      바로 등록
                    </>
                  )}
                </button>
              </div>
              <ReportForm
                groupId={selectedGroupId}
                pets={approvedPets}
                backHref="/reports"
                backLabel="취소"
                successRedirect="/reports"
                hideActions
                formId="report-form"
                onLoadingChange={setIsSubmitting}
                showDailyRecord={isAdmin}
              />
            </div>
          ) : isLoadingGroupDetail ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
              <p className="mt-3 text-sm text-zinc-500">불러오는 중...</p>
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center py-12">
              <p className="text-sm text-zinc-500">데이터를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
