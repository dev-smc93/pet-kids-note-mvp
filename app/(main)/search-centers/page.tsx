"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

const SIDO_OPTIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

interface Group {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  address: string;
}

interface Pet {
  id: string;
  name: string;
  breed: string | null;
}

export default function SearchCentersPage() {
  const [sido, setSido] = useState("서울특별시");
  const [groups, setGroups] = useState<Group[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && profile?.role !== "GUARDIAN") {
      router.replace("/");
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (profile?.role !== "GUARDIAN") return;
    fetch(`/api/groups?sido=${encodeURIComponent(sido)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups);
  }, [sido, profile?.role]);

  useEffect(() => {
    if (profile?.role !== "GUARDIAN") return;
    fetch("/api/pets")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPets);
  }, [profile?.role]);

  const handleRequest = async () => {
    if (!selectedGroup || !selectedPet) {
      setMessage({ type: "error", text: "원과 반려동물을 선택해주세요." });
      return;
    }
    setIsRequesting(true);
    setMessage(null);
    const res = await fetch("/api/memberships/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: selectedGroup.id, petId: selectedPet.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: "연결 요청을 보냈습니다. 관리자 승인을 기다려주세요." });
      setSelectedGroup(null);
      setSelectedPet(null);
    } else {
      setMessage({ type: "error", text: data.error ?? "요청에 실패했습니다." });
    }
    setIsRequesting(false);
  };

  if (authLoading || profile?.role !== "GUARDIAN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <Link href="/my-pets" className="text-lg font-semibold text-zinc-900">
          ← 원 검색
        </Link>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">원 검색</h1>
            <p className="mt-1 text-sm text-zinc-500">
              시/도를 선택해 원을 검색하고 연결 요청을 보내세요.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              시/도
            </label>
            <select
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {SIDO_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-zinc-700">검색 결과</h2>
            {groups.length === 0 ? (
              <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                <p className="text-zinc-500">해당 지역에 등록된 원이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setSelectedGroup(selectedGroup?.id === g.id ? null : g)
                    }
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selectedGroup?.id === g.id
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <p className="font-medium text-zinc-900">{g.name}</p>
                    <p className="text-sm text-zinc-500">
                      {g.sido} {g.sigungu} {g.address}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {pets.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-zinc-700">
                연결할 반려동물
              </h2>
              <div className="flex flex-wrap gap-2">
                {pets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedPet(selectedPet?.id === p.id ? null : p)
                    }
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      selectedPet?.id === p.id
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-700 shadow-sm hover:bg-zinc-100"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedGroup && selectedPet && (
            <Button
              onClick={handleRequest}
              fullWidth
              isLoading={isRequesting}
            >
              {selectedGroup.name}에 연결 요청
            </Button>
          )}

          {message && (
            <p
              className={`rounded-lg p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}

          {pets.length === 0 && (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              반려동물을 먼저 등록해주세요.{" "}
              <Link href="/my-pets/pets/new" className="underline">
                반려동물 등록하기
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
