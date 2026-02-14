"use client";

import { AuthProvider as SupabaseAuthProvider } from "@/lib/auth/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}
