/**
 * 로그아웃 시 브라우저 푸시 구독 해제 + DB 삭제
 * (다른 계정 로그인 시 이전 계정 알림이 오는 문제 방지)
 */
export async function unsubscribePushOnLogout(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length === 0) return;

    for (const reg of regs) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
    }
  } catch (err) {
    console.error("[unsubscribePushOnLogout]", err);
    // 실패해도 로그아웃은 진행
  }
}
