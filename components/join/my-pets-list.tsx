"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Pet {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
}

interface Membership {
  id: string;
  status: string;
  group: { id: string; name: string; sido: string; sigungu: string };
  pet: { id: string; name: string; breed: string | null; photoUrl: string | null };
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    APPROVED: { label: "연결됨", className: "bg-green-100 text-green-800" },
    PENDING: { label: "승인 대기", className: "bg-amber-100 text-amber-800" },
    REJECTED: { label: "거절됨", className: "bg-red-100 text-red-700" },
  };
  const { label, className } = config[status as keyof typeof config] ?? {
    label: status,
    className: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function MyPetsList() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Membership | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/pets").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/memberships").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([p, m]) => {
        setPets(p);
        setMemberships(m);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReRequest = async (groupId: string, petId: string) => {
    const res = await fetch("/api/memberships/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, petId }),
    });
    if (res.ok) fetchData();
  };

  const handleDelete = async (membershipId: string) => {
    const res = await fetch(`/api/memberships/${membershipId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700">내 반려동물</h2>
          <Link
            href="/my-pets/pets/new"
            className="text-sm font-medium text-zinc-900 underline"
          >
            + 등록
          </Link>
        </div>
        {pets.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-zinc-600">등록된 반려동물이 없습니다.</p>
            <Link
              href="/my-pets/pets/new"
              className="mt-2 inline-block text-sm font-medium text-zinc-900 underline"
            >
              반려동물 등록하기
            </Link>
          </div>
        ) : (
          <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-lg">
            {pets.map((pet) => (
              <Link
                key={pet.id}
                href={`/my-pets/pets/${pet.id}/edit`}
                className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm transition hover:bg-zinc-50"
              >
                {pet.photoUrl ? (
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl">
                    🐾
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">{pet.name}</p>
                  {pet.breed && (
                    <p className="text-sm text-zinc-500">{pet.breed}</p>
                  )}
                </div>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700">연결된 원</h2>
          <Link
            href="/search-centers"
            className="text-sm font-medium text-zinc-900 underline"
          >
            원 검색
          </Link>
        </div>
        {memberships.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            <p className="text-zinc-600">연결된 원이 없습니다.</p>
            <p className="mt-2 text-sm text-zinc-500">
              원을 검색해 연결 요청을 보내세요.
            </p>
            <Link
              href="/search-centers"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
            >
              원 검색하기
            </Link>
          </div>
        ) : (
          <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-lg">
            {memberships.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-lg p-4 shadow-sm ${
                  m.status === "REJECTED" ? "bg-red-50/50" : "bg-white"
                }`}
              >
                {m.pet?.photoUrl ? (
                  <img
                    src={m.pet.photoUrl}
                    alt={m.pet.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl">
                    🐾
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{m.pet.name}</p>
                  <p className="text-sm text-zinc-500">
                    {m.group.name} ({m.group.sido} {m.group.sigungu})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.status === "REJECTED" ? (
                    <>
                      <StatusBadge status={m.status} />
                      <div className="flex flex-col items-end gap-1.5">
                        <Button
                          variant="outline"
                          className="min-w-[72px] px-2 py-1.5 text-xs"
                          onClick={() => handleReRequest(m.group.id, m.pet.id)}
                        >
                          재요청
                        </Button>
                        <Button
                          variant="danger"
                          className="min-w-[72px] px-2 py-1.5 text-xs"
                          onClick={() => setDeleteTarget(m)}
                        >
                          삭제
                        </Button>
                      </div>
                    </>
                  ) : (
                    <StatusBadge status={m.status} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="목록에서 삭제"
        description="이 연결 요청을 목록에서 삭제하시겠습니까? 나중에 원 검색을 통해 다시 요청할 수 있습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  );
}
