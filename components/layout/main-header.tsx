"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/layout/app-logo";

interface MainHeaderProps {
  /** 홈 페이지용: 로고 + 프로필/로그아웃 */
  variant: "home";
  /** 홈이 아닐 때: 뒤로가기 링크 */
  backHref?: never;
  backLabel?: never;
}

interface MainHeaderBackProps {
  variant: "back";
  backHref: string;
  backLabel: string;
}

export function MainHeader(props: MainHeaderProps | MainHeaderBackProps) {
  if (props.variant === "home") {
    const { profile, signOut } = useAuth();
    return (
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <h1>
          <AppLogo showText asLink={false} />
        </h1>
        <div className="flex items-center gap-2">
          {profile && (
            <span className="text-sm text-zinc-600">{profile.name}</span>
          )}
          <Button variant="ghost" onClick={() => signOut()} className="text-sm">
            로그아웃
          </Button>
        </div>
      </header>
    );
  }

  const { backHref, backLabel } = props;
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Link href={backHref} className="text-lg font-semibold text-zinc-900 hover:underline shrink-0">
          ← {backLabel}
        </Link>
        <AppLogo showText={false} asLink size={24} />
      </div>
    </header>
  );
}
