"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface GroupData {
  id: string;
  memberships: { pet: PetOption; user?: { name: string }; status: string }[];
}

export default function ReportNewPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<GroupData | null>(null);

  useEffect(() => {
    if (!isLoading && profile?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    if (profile?.role === "ADMIN") {
      fetch(`/api/groups/${groupId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setGroup)
        .catch(() => setGroup(null));
    }
  }, [profile, isLoading, router, groupId]);

  if (isLoading || profile?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  const approvedPets =
    group?.memberships
      .filter((m) => m.status === "APPROVED")
      .map((m) => ({ ...m.pet, ownerName: m.user?.name ?? "" })) ?? [];

  if (group && approvedPets.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
          <Link href={`/groups/${groupId}`} className="flex h-10 w-10 items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">알림장 작성</h1>
          <div className="h-10 w-10" />
        </header>
        <main className="flex-1 px-4 py-6">
          <div className="rounded-lg bg-white p-6 text-center">
            <p className="text-zinc-600">연결된 반려동물이 없어 알림장을 작성할 수 없습니다.</p>
            <Link href={`/groups/${groupId}`} className="mt-4 inline-block">
              <span className="text-zinc-900 underline">원 정보로 돌아가기</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
        <Link href={`/groups/${groupId}`} className="flex h-10 w-10 items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-white">알림장 작성</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          {group ? (
            <ReportForm
              groupId={groupId}
              pets={approvedPets}
              backHref={`/groups/${groupId}`}
              backLabel="취소"
            />
          ) : (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
