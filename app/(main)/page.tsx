import { redirect } from "next/navigation";
import { getHomeData } from "@/lib/server/home-data";
import { HomeClient } from "./home-client";
import type { Profile } from "@/lib/auth/types";

export default async function HomePage() {
  const { profile, user, groupCount, unreadCount, error } = await getHomeData();

  if (!user) {
    redirect("/auth/login");
  }
  if (!profile) {
    redirect("/auth/profile");
  }

  return (
    <HomeClient
      initialProfile={profile as Profile}
      initialGroupCount={groupCount}
      initialUnreadCount={unreadCount}
    />
  );
}
