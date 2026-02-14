"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/search-centers");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
    </div>
  );
}
