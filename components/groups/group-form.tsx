"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
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

export function GroupForm() {
  const [name, setName] = useState("");
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("원 이름을 입력해주세요.");
      return;
    }
    if (!sido.trim()) {
      setError("시/도를 선택해주세요.");
      return;
    }
    setIsLoading(true);

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        sido,
        sigungu: sigungu.trim(),
        address: address.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "생성에 실패했습니다.");
      setIsLoading(false);
      return;
    }

    router.push(`/groups/${data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">원 만들기</h1>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Input
        label="원 이름"
        placeholder="예: 해피펫 유치원"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

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

      <Input
        label="시/군/구"
        placeholder="예: 강남구"
        value={sigungu}
        onChange={(e) => setSigungu(e.target.value)}
      />

      <Input
        label="상세 주소"
        placeholder="예: 테헤란로 123"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div className="flex gap-3">
        <Link href="/groups" className="flex-1">
          <Button type="button" variant="outline" fullWidth>
            취소
          </Button>
        </Link>
        <Button type="submit" fullWidth isLoading={isLoading}>
          만들기
        </Button>
      </div>
    </form>
  );
}
