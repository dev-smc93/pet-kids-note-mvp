"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

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

export function ProfileForm() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "GUARDIAN">("GUARDIAN");
  const [groupName, setGroupName] = useState("");
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRole(profile.role);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (role === "ADMIN") {
      if (!groupName.trim()) {
        setError("원 이름을 입력해주세요.");
        return;
      }
      if (!sido.trim()) {
        setError("시/도를 선택해주세요.");
        return;
      }
    }

    setIsLoading(true);

    const body: Record<string, string> = {
      name: name.trim(),
      role,
    };
    if (role === "ADMIN") {
      body.groupName = groupName.trim();
      body.sido = sido;
      body.sigungu = sigungu.trim();
      body.address = address.trim();
    }

    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다.");
      setIsLoading(false);
      return;
    }

    await refreshProfile();
    router.push("/");
    router.refresh();
    setIsLoading(false);
  };

  if (!authLoading && !user) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">
        {profile ? "프로필 수정" : "프로필 설정"}
      </h1>
      <p className="text-sm text-zinc-600">
        {profile
          ? "닉네임과 역할을 수정할 수 있습니다."
          : "서비스 이용을 위해 프로필을 설정해주세요."}
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Input
        type="text"
        label="닉네임"
        placeholder="닉네임을 입력하세요"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={50}
      />

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          역할
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 has-[:checked]:border-zinc-900 has-[:checked]:ring-2 has-[:checked]:ring-zinc-200">
            <input
              type="radio"
              name="role"
              value="GUARDIAN"
              checked={role === "GUARDIAN"}
              onChange={() => setRole("GUARDIAN")}
              className="sr-only"
            />
            <span className="text-sm font-medium">보호자</span>
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 has-[:checked]:border-zinc-900 has-[:checked]:ring-2 has-[:checked]:ring-zinc-200">
            <input
              type="radio"
              name="role"
              value="ADMIN"
              checked={role === "ADMIN"}
              onChange={() => setRole("ADMIN")}
              className="sr-only"
            />
            <span className="text-sm font-medium">관리자</span>
          </label>
        </div>
      </div>

      {role === "ADMIN" && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
          <p className="text-sm font-medium text-zinc-700">원 정보</p>
          <Input
            type="text"
            label="원 이름"
            placeholder="예: 해피펫 유치원"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required={role === "ADMIN"}
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
            type="text"
            label="시/군/구"
            placeholder="예: 강남구"
            value={sigungu}
            onChange={(e) => setSigungu(e.target.value)}
          />
          <Input
            type="text"
            label="상세 주소"
            placeholder="예: 테헤란로 123"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" fullWidth isLoading={isLoading}>
        {profile ? "저장" : "완료"}
      </Button>
    </form>
  );
}
