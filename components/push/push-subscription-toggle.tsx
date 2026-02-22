"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushSubscriptionToggle() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        !!VAPID_PUBLIC_KEY
    );
  }, []);

  useEffect(() => {
    if (!isSupported || !user) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    );
  }, [isSupported, user]);

  const subscribe = async () => {
    if (!user || !isSupported || !VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "구독에 실패했습니다.");
      }

      setIsSubscribed(true);
      setMessage("알림 구독이 완료되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "알림 구독에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user || !isSupported) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setMessage("알림 구독이 해제되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "구독 해제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribe();
      } else if (permission === "denied") {
        setMessage("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.");
      } else {
        setMessage("알림 권한을 허용해주세요.");
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        푸시 알림
      </label>
      <p className="mb-2 text-xs text-zinc-500">
        알림장 등록, 댓글, 재알림 시 푸시 알림을 받을 수 있습니다.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
            isSubscribed
              ? "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              : "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isSubscribed ? (
            "알림 해제"
          ) : (
            "알림 받기"
          )}
        </button>
      </div>
      {message && (
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
