import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api/auth";
import { fetchReportsList } from "@/lib/api/fetch-reports";

/**
 * 초기 로딩용 통합 API: profile + reports를 한 번에 반환
 * API 호출 횟수를 줄여 네트워크 왕복 시간 감소
 */
export async function GET(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const groupIdsParam = searchParams.get("groupIds");
  const groupIdParam = searchParams.get("groupId");
  const filterGroupIds = groupIdsParam
    ? groupIdsParam.split(",").filter(Boolean)
    : groupIdParam
      ? [groupIdParam]
      : [];
  const mineOnly = searchParams.get("mineOnly") === "true";

  const reports = await fetchReportsList(profile!, {
    groupIds: filterGroupIds,
    mineOnly,
  });

  return NextResponse.json({
    profile,
    reports,
  });
}
