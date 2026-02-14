"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { GuardianPetForm } from "@/components/pets/guardian-pet-form";
import { MainHeader } from "@/components/layout/main-header";

export default function EditPetPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const [petId, setPetId] = useState<string | null>(null);
  const [pet, setPet] = useState<{
    id: string;
    name: string;
    breed: string | null;
    photoUrl: string | null;
    note: string | null;
  } | null>(null);
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setPetId(p.petId));
  }, [params]);

  useEffect(() => {
    if (!isLoading && profile?.role !== "GUARDIAN") {
      router.replace("/");
    }
  }, [profile, isLoading, router]);

  useEffect(() => {
    if (!petId) return;
    fetch("/api/pets")
      .then((res) => (res.ok ? res.json() : []))
      .then((pets: { id: string; name: string; breed: string | null; photoUrl: string | null; note: string | null }[]) => {
        const found = pets.find((p) => p.id === petId);
        setPet(found ?? null);
      });
  }, [petId]);

  if (isLoading || profile?.role !== "GUARDIAN" || !petId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-600">반려동물을 찾을 수 없습니다.</p>
        <Link href="/my-pets" className="text-zinc-900 underline">
          내 반려동물로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MainHeader variant="back" backHref="/my-pets" backLabel="반려동물 수정" />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <GuardianPetForm pet={pet} />
        </div>
      </main>
    </div>
  );
}
