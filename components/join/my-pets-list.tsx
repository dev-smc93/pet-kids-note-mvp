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

  const membershipsByPet = memberships.reduce((acc, m) => {
    const pid = m.pet.id;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(m);
    return acc;
  }, {} as Record<string, Membership[]>);

  return (
    <div className="space-y-6">
      <section>
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
          <div className="max-h-[80vh] space-y-4 overflow-y-auto">
            {pets.map((pet) => {
              const petMemberships = membershipsByPet[pet.id] ?? [];
              return (
                <div
                  key={pet.id}
                  className="overflow-hidden rounded-lg bg-white shadow-sm"
                >
                  <Link
                    href={`/my-pets/pets/${pet.id}/edit`}
                    className="flex items-center gap-3 p-4 transition hover:bg-zinc-50"
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900">{pet.name}</p>
                      {pet.breed && (
                        <p className="text-sm text-zinc-500">{pet.breed}</p>
                      )}
                    </div>
                    <span className="text-zinc-400">→</span>
                  </Link>
                  <div className="border-t border-zinc-100 px-4 py-3">
                    {petMemberships.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        연결된 원이 없습니다.{" "}
                        <Link
                          href="/search-centers"
                          className="font-medium text-zinc-900 underline"
                        >
                          원 검색하기
                        </Link>
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {petMemberships.map((m) => (
                          <div
                            key={m.id}
                            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${
                              m.status === "REJECTED" ? "bg-red-50/50" : "bg-zinc-50"
                            }`}
                          >
                            <p className="text-sm text-zinc-700">
                              {m.group.name} ({m.group.sido} {m.group.sigungu})
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                              {m.status === "REJECTED" ? (
                                <>
                                  <StatusBadge status={m.status} />
                                  <Button
                                    variant="outline"
                                    className="px-2 py-1 text-xs"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleReRequest(m.group.id, m.pet.id);
                                    }}
                                  >
                                    재요청
                                  </Button>
                                  <Button
                                    variant="danger"
                                    className="px-2 py-1 text-xs"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setDeleteTarget(m);
                                    }}
                                  >
                                    삭제
                                  </Button>
                                </>
                              ) : (
                                <StatusBadge status={m.status} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
