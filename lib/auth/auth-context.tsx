"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { unsubscribePushOnLogout } from "@/lib/push/unsubscribe-on-logout";
import type { AuthState, Profile } from "./types";

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** bootstrap API 응답으로 profile 설정 (Reports 페이지용) */
  setProfileFromBootstrap: (profile: Profile | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const supabase = createClient();

  const setProfileFromBootstrap = useCallback((p: Profile | null) => {
    setProfile(p);
    setIsProfileLoading(false);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const res = await fetch("/api/auth/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    } else {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setIsProfileLoading(true);
    await fetchProfile(user.id);
    setIsProfileLoading(false);
  }, [user, fetchProfile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsProfileLoading(true);
        await fetchProfile(session.user.id);
        setIsProfileLoading(false);
      } else {
        setProfile(null);
      }
    });

    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser ?? null);
      if (currentUser) {
        const isServerDataPage = pathname === "/reports" || pathname === "/";
        if (!isServerDataPage) {
          setIsProfileLoading(true);
          fetchProfile(currentUser.id).finally(() => setIsProfileLoading(false));
        }
      }
      setIsLoading(false);
    };

    init();

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchProfile, pathname]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase.auth]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        return { error: "이미 등록된 이메일입니다. 로그인해 주세요." };
      }
      return { error: null };
    },
    [supabase.auth]
  );

  const signOut = useCallback(async () => {
    // 세션 유효 시점에 푸시 구독 해제 (signOut 전에 호출해야 DELETE API 인증 성공)
    await unsubscribePushOnLogout();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase.auth]);

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isProfileLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    setProfileFromBootstrap,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
