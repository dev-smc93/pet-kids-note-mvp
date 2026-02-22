import { redirect } from "next/navigation";
import { getBootstrapData } from "@/lib/server/bootstrap";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupIds?: string; groupId?: string; mineOnly?: string }>;
}) {
  const params = await searchParams;
  const groupIds = params.groupIds
    ? params.groupIds.split(",").filter(Boolean)
    : params.groupId
      ? [params.groupId]
      : [];
  const mineOnly = params.mineOnly === "true";

  const { profile, reports, error } = await getBootstrapData({
    groupIds,
    mineOnly,
  });

  if (error || !profile) {
    redirect("/auth/login");
  }

  return (
    <ReportsClient
      initialProfile={profile}
      initialReports={reports}
      groupIds={groupIds}
      mineOnly={mineOnly}
    />
  );
}
