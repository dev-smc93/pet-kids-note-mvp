"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function ProfileForm() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "GUARDIAN">("GUARDIAN");
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

    setIsLoading(true);

    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role }),
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
            <span className="text-sm font-medium text-zinc-900">보호자</span>
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
            <span className="text-sm font-medium text-zinc-900">관리자</span>
          </label>
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        {profile ? "저장" : "완료"}
      </Button>
    </form>
  );
}
