import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { IMAGES } from "@/lib/constants/images";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-zinc-50 px-4 py-8">
      {/* 배경 로고: 연하고 크게 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <Image src={IMAGES.logo.appLogo} alt="" width={720} height={720} className="opacity-[0.06]" />
      </div>
      <div className="relative z-10 flex flex-1 w-full items-center justify-center">
        <LoginForm />
      </div>
      <p className="relative z-10 text-center text-xs text-zinc-400">Made by SungmanJo</p>
    </div>
  );
}
