"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed";
const IN_APP_BROWSER_DISMISS_KEY = "pwa-inapp-browser-dismissed";
const DISMISS_EXPIRY_MS = 2 * 60 * 1000; // 2분 (테스트용, 배포 시 24*60*60*1000으로 변경)

function isDismissExpired(key: string): boolean {
  const stored = localStorage.getItem(key);
  if (!stored) return true;
  const timestamp = parseInt(stored, 10);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > DISMISS_EXPIRY_MS;
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** 카카오톡, 네이버, 인스타그램 등 인앱 브라우저 감지 */
function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    ua.includes("kakaotalk") ||
    ua.includes("naver") ||
    ua.includes("instagram") ||
    ua.includes("line/") ||
    ua.includes("fbav") ||
    ua.includes("fban") ||
    ua.includes("fb_iab")
  );
}

function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}

function openInExternalBrowser(): void {
  const url = window.location.href;
  if (isAndroid()) {
    const pathAndQuery = url.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/#/g, "%23");
    const intentUrl = `intent://${pathAndQuery}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInAppBanner, setShowInAppBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    if (isInAppBrowser()) {
      if (isDismissExpired(IN_APP_BROWSER_DISMISS_KEY)) {
        localStorage.removeItem(IN_APP_BROWSER_DISMISS_KEY);
        setShowInAppBanner(true);
      }
      return;
    }

    if (!isDismissExpired(DISMISS_KEY)) return;
    localStorage.removeItem(DISMISS_KEY);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleInAppDismiss = () => {
    setShowInAppBanner(false);
    localStorage.setItem(IN_APP_BROWSER_DISMISS_KEY, Date.now().toString());
  };

  if (showInAppBanner) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
        role="dialog"
        aria-label="브라우저에서 열기 안내"
      >
        <div className="mx-auto max-w-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
              <img src="/images/icons/icon-96.png" alt="" className="h-10 w-10" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900">앱 설치를 위해 브라우저에서 열어주세요</p>
              <p className="text-sm text-zinc-500">{isAndroid() ? "Chrome에서 열면 앱 설치가 가능합니다" : "Safari에서 열면 홈 화면에 추가할 수 있습니다"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleInAppDismiss}>
              나중에
            </Button>
            <Button size="sm" onClick={openInExternalBrowser}>
              {isAndroid() ? "Chrome에서 열기" : "브라우저에서 열기"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!showBanner || isInstalled) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
      role="dialog"
      aria-label="앱 설치 안내"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
          <img src="/images/icons/icon-96.png" alt="" className="h-10 w-10" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900">반려동물 알림장</p>
          <p className="text-sm text-zinc-500">홈 화면에 추가해서 더 빠르게 이용하세요</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            나중에
          </Button>
          <Button size="sm" onClick={handleInstall}>
            설치
          </Button>
        </div>
      </div>
    </div>
  );
}
