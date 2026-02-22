import { getAuthUser } from "@/lib/api/auth";
import { fetchReportsList } from "@/lib/api/fetch-reports";

export interface BootstrapParams {
  groupIds?: string[];
  mineOnly?: boolean;
}

export async function getBootstrapData(params: BootstrapParams = {}) {
  const { profile, error } = await getAuthUser();
  if (error || !profile) {
    return { profile: null, reports: [], error };
  }

  const rawReports = await fetchReportsList(profile, {
    groupIds: params.groupIds ?? [],
    mineOnly: params.mineOnly ?? false,
  });

  const reports = JSON.parse(JSON.stringify(rawReports));

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      role: profile.role,
      name: profile.name,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    reports,
    error: null,
  };
}
