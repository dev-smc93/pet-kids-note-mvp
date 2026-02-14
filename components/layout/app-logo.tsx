"use client";

import Link from "next/link";
import Image from "next/image";
import { IMAGES } from "@/lib/constants/images";

interface AppLogoProps {
  /** 로고와 함께 앱 이름 표시 여부 */
  showText?: boolean;
  /** 링크로 감쌀지 (홈으로 이동) */
  asLink?: boolean;
  /** 로고 크기 (px) */
  size?: number;
  className?: string;
}

export function AppLogo({
  showText = true,
  asLink = false,
  size = 28,
  className = "",
}: AppLogoProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ gap: "0.5rem" }}
    >
      <Image
        src={IMAGES.logo.appLogo}
        alt="반려동물 알림장"
        width={size}
        height={size}
        className="shrink-0"
      />
      {showText && (
        <span className="text-lg font-semibold text-zinc-900">
          반려동물 알림장
        </span>
      )}
    </span>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        className="hover:opacity-90 transition-opacity shrink-0"
        aria-label={showText ? undefined : "홈으로"}
      >
        {content}
      </Link>
    );
  }

  return content;
}
