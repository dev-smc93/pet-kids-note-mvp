/**
 * 이미지 경로 상수 (구조화)
 * public/ 기준 상대 경로
 */
export const IMAGES = {
  logo: {
    appLogo: "/images/logo/app-logo.svg",
    icon: "/images/logo/icon.svg",
  },
  /** 카카오톡/OG 공유용 이미지 (권장: 1200x630 PNG, 5MB 이하. og-image.png 추가 시 이 경로로 변경) */
  ogImage: "/images/og-image.png",
  /** PWA manifest 아이콘 (다양한 해상도) */
  pwaIcons: "/images/icons",
} as const;
