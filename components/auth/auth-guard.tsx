"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/profile"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isProfileLoading) return;

    const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

    if (!user && !isAuthPath) {
      router.replace("/auth/login");
      return;
    }

    if (user && !profile && !pathname.startsWith("/auth/profile") && pathname !== "/reports" && pathname !== "/") {
      router.replace("/auth/profile");
      return;
    }
  }, [user, profile, isLoading, isProfileLoading, pathname, router]);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (!user && !isAuthPath) return null;
  if (user && !profile && !pathname.startsWith("/auth/profile") && pathname !== "/reports" && pathname !== "/") return null;

  return <>{children}</>;
}
