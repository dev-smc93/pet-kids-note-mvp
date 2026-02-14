"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Group {
  id: string;
  name: string;
  _count: { memberships: number };
}

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-sm">
        <p className="text-zinc-600">등록된 원이 없습니다.</p>
        <Link href="/groups/new" className="mt-4 inline-block">
          <Button>원 만들기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/groups/${group.id}`}
          className="block rounded-lg bg-white p-4 shadow-sm transition hover:bg-zinc-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-zinc-900">{group.name}</h3>
              <p className="text-sm text-zinc-500">
                연결 {group._count.memberships}건
              </p>
            </div>
            <span className="text-zinc-400">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
