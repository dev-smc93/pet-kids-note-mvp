"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { MyPetsList } from "@/components/join/my-pets-list";
import { MainHeader } from "@/components/layout/main-header";

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
      <MainHeader variant="back" backHref="/" backLabel="내 반려동물" />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-4">
            <p className="text-sm text-zinc-500">
              반려동물을 등록하고 원과 연결하세요.
            </p>
          </div>
          <MyPetsList />
        </div>
      </main>
    </div>
  );
}
