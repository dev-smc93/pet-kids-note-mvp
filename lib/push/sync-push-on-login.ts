/**
 * 로그인 상태 + 브라우저 구독 있음 → 서버에 active=true로 동기화
 * (로그아웃 후 재로그인 시 별도 "알림 받기" 클릭 없이 푸시 재활성화)
 */
export async function syncPushSubscriptionOnLogin(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
  } catch (err) {
    console.error("[syncPushSubscriptionOnLogin]", err);
  }
}
