import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PageTransition } from "@/components/page-transition";
import { InstallPrompt } from "@/components/install-prompt";
import { IMAGES } from "@/lib/constants/images";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "반려동물 알림장";
const APP_DESCRIPTION = "반려동물 돌봄 알림장 - MVP버전(smj)";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://localhost:3000");

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  themeColor: "#52525b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: IMAGES.logo.icon,
    apple: "/images/icons/icon-152.png",
  },
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: IMAGES.ogImage,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [IMAGES.ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <PageTransition>{children}</PageTransition>
          <InstallPrompt />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
