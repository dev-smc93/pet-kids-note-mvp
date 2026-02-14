"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { MyPetsList } from "@/components/join/my-pets-list";

export default function MyPetsPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile?.role !== "GUARDIAN") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  if (isLoading || profile?.role !== "GUARDIAN") {
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
          ← 내 반려동물
        </Link>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-zinc-900">내 반려동물</h1>
            <p className="mt-1 text-sm text-zinc-500">
              반려동물을 등록하고 원과 연결하세요.
            </p>
          </div>
          <MyPetsList />
        </div>
      </main>
    </div>
  );
}
