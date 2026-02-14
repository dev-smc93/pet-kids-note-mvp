"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface GroupFormProps {
  group?: { id: string; name: string; sido: string; sigungu: string; address: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

export function GroupForm({ group, onSuccess, onCancel }: GroupFormProps) {
  const [name, setName] = useState("");
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!group;

  useEffect(() => {
    if (group) {
      setName(group.name);
      setSido(group.sido || "서울특별시");
      setSigungu(group.sigungu || "");
      setAddress(group.address || "");
    }
  }, [group]);

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

    const url = isEdit ? `/api/groups/${group.id}` : "/api/groups";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
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
      setError(data.error ?? (isEdit ? "수정에 실패했습니다." : "생성에 실패했습니다."));
      setIsLoading(false);
      return;
    }

    if (isEdit && onSuccess) {
      onSuccess();
    } else {
      router.push(`/groups/${data.id}`);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">
        {isEdit ? "원 정보 수정" : "원 등록하기"}
      </h1>

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

      <Select
        label="시/도"
        value={sido}
        onChange={(e) => setSido(e.target.value)}
      >
        {SIDO_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

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
        {isEdit && onCancel ? (
          <div className="flex-1">
            <Button type="button" variant="outline" fullWidth onClick={onCancel}>
              취소
            </Button>
          </div>
        ) : (
          <Link href="/groups" className="flex-1">
            <Button type="button" variant="outline" fullWidth>
              취소
            </Button>
          </Link>
        )}
        <div className="flex-1">
          <Button type="submit" fullWidth isLoading={isLoading}>
            {isEdit ? "저장" : "등록하기"}
          </Button>
        </div>
      </div>
    </form>
  );
}
