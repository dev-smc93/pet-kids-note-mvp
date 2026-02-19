"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupForm } from "@/components/groups/group-form";

interface Membership {
  id: string;
  status: string;
  pet: { id: string; name: string; breed: string | null; photoUrl: string | null };
  user: { name: string };
}

interface GroupDetailData {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  address: string;
  memberships: Membership[];
}

export function GroupDetail({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<GroupDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchGroup = () => {
    fetch(`/api/groups/${groupId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setGroup)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const handleApproveReject = async (membershipId: string, status: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/memberships/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchGroup();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="rounded-lg bg-white p-6 text-center">
        <p className="text-zinc-600">원을 찾을 수 없습니다.</p>
        <Link href="/groups" className="mt-4 inline-block">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    );
  }

  const pending = group.memberships.filter((m) => m.status === "PENDING");
  const approved = group.memberships.filter((m) => m.status === "APPROVED");

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        {isEditing ? (
          <GroupForm
            group={{
              id: group.id,
              name: group.name,
              sido: group.sido,
              sigungu: group.sigungu,
              address: group.address,
            }}
            onSuccess={() => {
              fetchGroup();
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{group.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {group.sido} {group.sigungu} {group.address}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                원 정보 수정
              </Button>
            </div>
          </>
        )}
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="font-medium text-zinc-900">승인 대기 ({pending.length})</h3>
          <ul className="mt-3 space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3"
              >
                <div className="flex items-center gap-3">
                  {m.pet.photoUrl ? (
                    <img
                      src={m.pet.photoUrl}
                      alt={m.pet.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
                      🐾
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-zinc-900">{m.pet.name}</p>
                    <p className="text-xs text-zinc-600">{m.user.name} (보호자)</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleApproveReject(m.id, "REJECTED")}
                    className="text-sm"
                  >
                    거절
                  </Button>
                  <Button
                    onClick={() => handleApproveReject(m.id, "APPROVED")}
                    className="text-sm"
                  >
                    승인
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="font-medium text-zinc-900">연결된 반려동물 ({approved.length})</h3>
        {approved.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">연결된 반려동물이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {approved.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3"
              >
                {m.pet.photoUrl ? (
                  <img
                    src={m.pet.photoUrl}
                    alt={m.pet.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
                    🐾
                  </div>
                )}
                <div>
                  <p className="font-medium text-zinc-900">{m.pet.name}</p>
                  <p className="text-xs text-zinc-600">{m.user.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
