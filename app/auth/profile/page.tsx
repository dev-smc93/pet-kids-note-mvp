import { ProfileForm } from "@/components/auth/profile-form";
import { MainHeader } from "@/components/layout/main-header";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MainHeader variant="back" backHref="/" backLabel="프로필 수정" />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}
