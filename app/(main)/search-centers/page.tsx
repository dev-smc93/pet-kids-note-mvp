"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const SIDO_OPTIONS = [
  { value: "", label: "전체" },
  { value: "서울특별시", label: "서울특별시" },
  { value: "부산광역시", label: "부산광역시" },
  { value: "대구광역시", label: "대구광역시" },
  { value: "인천광역시", label: "인천광역시" },
  { value: "광주광역시", label: "광주광역시" },
  { value: "대전광역시", label: "대전광역시" },
  { value: "울산광역시", label: "울산광역시" },
  { value: "세종특별자치시", label: "세종특별자치시" },
  { value: "경기도", label: "경기도" },
  { value: "강원특별자치도", label: "강원특별자치도" },
  { value: "충청북도", label: "충청북도" },
  { value: "충청남도", label: "충청남도" },
  { value: "전북특별자치도", label: "전북특별자치도" },
  { value: "전라남도", label: "전라남도" },
  { value: "경상북도", label: "경상북도" },
  { value: "경상남도", label: "경상남도" },
  { value: "제주특별자치도", label: "제주특별자치도" },
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
  const [sido, setSido] = useState("");
  const [keyword, setKeyword] = useState("");
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
    const params = new URLSearchParams({ search: "1" });
    if (sido) params.set("sido", sido);
    if (keyword.trim()) params.set("q", keyword.trim());
    fetch(`/api/groups?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups);
  }, [sido, keyword, profile?.role]);

  useEffect(() => {
    if (profile?.role !== "GUARDIAN") return;
    fetch("/api/pets")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPets);
  }, [profile?.role]);

  const [memberships, setMemberships] = useState<{ petId: string; status: string }[]>([]);
  const fetchMemberships = () => {
    fetch("/api/memberships")
      .then((res) => (res.ok ? res.json() : []))
      .then((m: { petId: string; status: string }[]) => setMemberships(m));
  };
  useEffect(() => {
    if (profile?.role !== "GUARDIAN") return;
    fetchMemberships();
  }, [profile?.role]);

  const busyPetIds = new Set(
    memberships
      .filter((m) => m.status === "PENDING" || m.status === "APPROVED")
      .map((m) => m.petId)
  );

  const handleRequest = async () => {
    if (!selectedGroup || !selectedPet) {
      setMessage({ type: "error", text: "원과 반려동물을 선택해주세요." });
      return;
    }
    if (busyPetIds.has(selectedPet.id)) {
      setMessage({ type: "error", text: "해당 반려동물은 이미 다른 원에 연결되어 있거나 승인 대기 중입니다." });
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
      fetchMemberships();
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
              원 이름으로 검색하거나 시/도로 필터링할 수 있습니다.
            </p>
          </div>

          <Input
            label="원 이름 검색"
            placeholder="예: 해피펫"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Select
            label="시/도"
            value={sido}
            onChange={(e) => setSido(e.target.value)}
          >
            {SIDO_OPTIONS.map((s) => (
              <option key={s.value || "all"} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>

          <div>
            <h2 className="mb-2 text-sm font-medium text-zinc-700">검색 결과</h2>
            {groups.length === 0 ? (
              <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                <p className="text-zinc-500">
                  {keyword.trim() || sido
                    ? "검색 결과가 없습니다."
                    : "등록된 원이 없습니다."}
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
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
                {pets.map((p) => {
                  const isBusy = busyPetIds.has(p.id);
                  const statusLabel = memberships.find((m) => m.petId === p.id && (m.status === "PENDING" || m.status === "APPROVED"));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => !isBusy && setSelectedPet(selectedPet?.id === p.id ? null : p)}
                      title={isBusy ? (statusLabel?.status === "APPROVED" ? "이미 다른 원에 연결됨" : "다른 원 승인 대기 중") : undefined}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        isBusy
                          ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
                          : selectedPet?.id === p.id
                            ? "bg-zinc-900 text-white"
                            : "bg-white text-zinc-700 shadow-sm hover:bg-zinc-100"
                      }`}
                    >
                      {p.name}
                      {isBusy && (
                        <span className="ml-1 text-xs opacity-80">
                          ({statusLabel?.status === "APPROVED" ? "연결됨" : "승인대기"})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedGroup && selectedPet && !busyPetIds.has(selectedPet.id) && (
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
