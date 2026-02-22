"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { syncPushSubscriptionOnLogin } from "@/lib/push/sync-push-on-login";

/**
 * 로그인 상태에서 앱 방문 시 구독이 있으면 서버에 active=true로 동기화
 */
export function PushSubscriptionSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    syncPushSubscriptionOnLogin();
  }, [user]);

  return null;
}
