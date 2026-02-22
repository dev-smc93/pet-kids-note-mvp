import { redirect } from "next/navigation";
import { getHomeData } from "@/lib/server/home-data";
import { HomeClient } from "./home-client";
import type { Profile } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { profile, user, groupCount, unreadCount, error } = await getHomeData();

  if (!profile) {
    if (!user) redirect("/auth/login");
    else redirect("/auth/profile");
  }

  return (
    <HomeClient
      initialProfile={profile as Profile}
      initialGroupCount={groupCount}
      initialUnreadCount={unreadCount}
    />
  );
}
