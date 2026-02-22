import { redirect } from "next/navigation";
import { getHomeData } from "@/lib/server/home-data";
import { HomeClient } from "./home-client";
import type { Profile } from "@/lib/auth/types";

export default async function HomePage() {
  const { profile, groupCount, unreadCount, error } = await getHomeData();

  if (error || !profile) {
    redirect("/auth/login");
  }

  return (
    <HomeClient
      initialProfile={profile as Profile}
      initialGroupCount={groupCount}
      initialUnreadCount={unreadCount}
    />
  );
}
