"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ReportForm } from "@/components/reports/report-form";
import { MainHeader } from "@/components/layout/main-header";

interface ReportData {
  id: string;
  content: string;
  pet: { id: string; name: string };
  media: { id: string; url: string }[];
}

export default function ReportEditPage() {
  const params = useParams();
  const reportId = params.id as string;
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!isLoading && profile?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    if (profile?.role === "ADMIN") {
      fetch(`/api/reports/${reportId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setReport)
        .catch(() => setReport(null));
    }
  }, [profile, isLoading, router, reportId]);

  if (isLoading || profile?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <MainHeader variant="back" backHref="/" backLabel="홈" />
        <main className="flex-1 px-4 py-6">
          <div className="rounded-lg bg-white p-6 text-center">
            <p className="text-zinc-600">알림장을 찾을 수 없습니다.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MainHeader
        variant="back"
        backHref={`/reports/${reportId}`}
        backLabel="알림장 상세"
      />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <ReportForm
            groupId=""
            pets={[{ id: report.pet.id, name: report.pet.name, breed: null, photoUrl: null }]}
            report={report}
            backHref={`/reports/${reportId}`}
            backLabel="취소"
          />
        </div>
      </main>
    </div>
  );
}
