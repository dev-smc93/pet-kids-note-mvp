/**
 * 로그아웃 시 DB에서 active=false로 비활성화 (구독 유지, 푸시 미발송)
 * - 브라우저 구독은 유지 → 재로그인 시 별도 구독 없이 푸시 재활성화
 * - sub.unsubscribe() 호출 안 함
 */
export async function deactivatePushOnLogout(): Promise<void> {
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
        await fetch(
          `/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}&active=false`,
          { method: "PATCH" }
        );
      }
    }
  } catch (err) {
    console.error("[deactivatePushOnLogout]", err);
    // 실패해도 로그아웃은 진행
  }
}
