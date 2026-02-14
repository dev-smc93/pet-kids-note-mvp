import { ProfileForm } from "@/components/auth/profile-form";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-8">
      <ProfileForm />
    </div>
  );
}
