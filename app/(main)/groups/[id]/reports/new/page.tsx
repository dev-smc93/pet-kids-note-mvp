"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { ReportForm } from "@/components/reports/report-form";
import { MainHeader } from "@/components/layout/main-header";

interface PetOption {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
}

interface GroupData {
  id: string;
  memberships: { pet: PetOption; status: string }[];
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

  const approvedPets = group?.memberships
    .filter((m) => m.status === "APPROVED")
    .map((m) => m.pet) ?? [];

  if (group && approvedPets.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <MainHeader variant="back" backHref={`/groups/${groupId}`} backLabel="원 정보" />
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
      <MainHeader
        variant="back"
        backHref={`/groups/${groupId}`}
        backLabel="원 정보"
      />

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
