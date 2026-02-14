"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { GroupList } from "@/components/groups/group-list";
import { Button } from "@/components/ui/button";

export default function GroupsPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  if (isLoading || profile?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          ← 원 관리
        </Link>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">내 원</h1>
            <Link href="/groups/new">
              <Button>원 만들기</Button>
            </Link>
          </div>
          <GroupList />
        </div>
      </main>
    </div>
  );
}
