"use client";

import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/layout/main-header";
import { useAuth } from "@/lib/auth/auth-context";

export function ProfilePageHeader() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleCancel = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  return (
    <MainHeader
      variant="back"
      backHref={profile ? "/" : undefined}
      backLabel={profile ? "프로필 수정" : "취소"}
      onBackClick={profile ? undefined : handleCancel}
    />
  );
}
