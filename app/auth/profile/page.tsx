import { ProfileForm } from "@/components/auth/profile-form";
import { ProfilePageHeader } from "@/components/auth/profile-page-header";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <ProfilePageHeader />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}
