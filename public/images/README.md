# 이미지 디렉터리 구조

```
images/
├── logo/
│   ├── app-logo.svg   # 헤더용 앱 로고 (발바닥 아이콘)
│   └── icon.svg       # favicon용
├── icons/             # PWA 아이콘 (npm run pwa:icons로 생성)
│   └── icon-*.png     # 72, 96, 128, 144, 152, 192, 384, 512
└── og-image.png      # 카카오톡/OG 공유용 (권장: 1200x630 PNG, 5MB 이하)
```

경로 상수: `lib/constants/images.ts`

**OG 이미지**: `og-image.png` 추가 시 `lib/constants/images.ts`의 `ogImage` 경로를 `/images/og-image.png`로 변경하세요. 카카오톡 링크 미리보기 품질이 향상됩니다.
