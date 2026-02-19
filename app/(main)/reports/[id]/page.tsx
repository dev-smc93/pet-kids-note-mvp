"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DAILY_RECORD_TITLES, getDailyRecordLabel } from "@/components/reports/daily-record-form";

interface ReportDetail {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pet: { id: string; name: string; photoUrl: string | null };
  author: { name: string };
  media: { id: string; url: string }[];
  isGuardianPost?: boolean;
  isReadByGuardian?: boolean;
  isRead?: boolean;
  readAt?: string | null;
  dailyRecord?: {
    mood?: string | null;
    health?: string | null;
    temperatureCheck?: string | null;
    mealStatus?: string | null;
    sleepTime?: string | null;
    bowelStatus?: string | null;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  scheduledAt?: string | null;
  author: { userId: string; name: string; role: string };
}

interface ScheduledComment extends Comment {
  scheduledAt: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentMenuOpen, setCommentMenuOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [commentDeleteOpen, setCommentDeleteOpen] = useState(false);
  const [isCommentDeleting, setIsCommentDeleting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [customDateTime, setCustomDateTime] = useState("");
  const [scheduledComments, setScheduledComments] = useState<ScheduledComment[]>([]);
  const [scheduledCancelOpen, setScheduledCancelOpen] = useState(false);
  const [scheduledToCancel, setScheduledToCancel] = useState<ScheduledComment | null>(null);
  const commentListRef = useRef<HTMLDivElement>(null);
  const prevCommentCountRef = useRef(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const LAST_SCHEDULE_KEY = "comment_schedule_last";

  const getPresetTimes = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const am1 = new Date(tomorrow);
    am1.setHours(8, 30, 0, 0);
    const am2 = new Date(tomorrow);
    am2.setHours(10, 0, 0, 0);
    const pm = new Date(tomorrow);
    pm.setHours(15, 0, 0, 0);
    const lastStored = typeof window !== "undefined" ? localStorage.getItem(LAST_SCHEDULE_KEY) : null;
    const lastTime = lastStored ? new Date(lastStored) : null;
    return { am1, am2, pm, last: lastTime && !isNaN(lastTime.getTime()) ? lastTime : null };
  };

  const formatScheduleLabel = (d: Date) =>
    `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;

  const fetchReport = (isRefetch = false) => {
    if (!isRefetch) setIsLoadingReport(true);
    fetch(`/api/reports/${reportId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setReport(data);
        setIsLoadingReport(false);
      })
      .catch(() => {
        setReport(null);
        setIsLoadingReport(false);
      });
  };

  const fetchComments = () => {
    fetch(`/api/reports/${reportId}/comments`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setComments);
  };

  const fetchScheduledComments = () => {
    fetch(`/api/reports/${reportId}/comments?scheduled=true`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setScheduledComments);
  };

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth/login");
      return;
    }
    if (profile) {
      fetchReport();
      fetchComments();
      fetchScheduledComments();
    }
  }, [profile, isLoading, reportId]);

  // 스크롤 화살표: 아래 내용 있을 때만 표시, 스크롤 시 숨김
  const checkScrollArrow = useCallback(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    const scrolled = el.scrollTop > 20;
    setShowScrollArrow(hasOverflow && !scrolled);
  }, []);

  useEffect(() => {
    if (!report) return;
    checkScrollArrow();
    const t1 = setTimeout(checkScrollArrow, 100);
    const t2 = setTimeout(checkScrollArrow, 500);
    const el = contentScrollRef.current;
    if (el) {
      const ro = new ResizeObserver(checkScrollArrow);
      ro.observe(el);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        ro.disconnect();
      };
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [report, checkScrollArrow]);


  // 새 댓글 추가 시 스크롤 맨 아래로
  useEffect(() => {
    const total = comments.length + scheduledComments.length;
    if (total > prevCommentCountRef.current) {
      commentListRef.current?.scrollTo({
        top: commentListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevCommentCountRef.current = total;
  }, [comments.length, scheduledComments.length]);

  useEffect(() => {
    if (report && !report.isRead) {
      fetch(`/api/reports/${reportId}/read`, { method: "POST" }).then(() => {
        fetchReport(true);
      });
    }
  }, [report?.id, report?.isRead, reportId]);

  // Supabase Realtime: 댓글 INSERT/UPDATE/DELETE 시 즉시 반영
  useEffect(() => {
    if (!reportId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`report-comments-${reportId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "report_comments",
        },
        (payload) => {
          const reportIdFromPayload =
            (payload.new as { report_id?: string } | null)?.report_id ??
            (payload.old as { report_id?: string } | null)?.report_id;
          if (reportIdFromPayload === reportId) {
            fetchComments();
            fetchScheduledComments();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  // 예약 댓글: 예약 시간 도래 시 DB 변경 없음 → 가장 가까운 예약 시각에 타이머로 refetch
  useEffect(() => {
    if (scheduledComments.length === 0) return;
    const earliest = scheduledComments.reduce((a, b) =>
      new Date(a.scheduledAt).getTime() < new Date(b.scheduledAt).getTime() ? a : b
    );
    const scheduledTime = new Date(earliest.scheduledAt).getTime();
    const delay = Math.max(0, scheduledTime - Date.now()) + 500;
    const timeout = setTimeout(() => {
      fetchComments();
      fetchScheduledComments();
    }, delay);
    return () => clearTimeout(timeout);
  }, [scheduledComments, reportId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const body: { content: string; scheduledAt?: string } = { content: newComment.trim() };
    if (scheduledAt) {
      body.scheduledAt = scheduledAt.toISOString();
      localStorage.setItem(LAST_SCHEDULE_KEY, scheduledAt.toISOString());
    }
    const res = await fetch(`/api/reports/${reportId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewComment("");
      setScheduledAt(null);
      fetchComments();
      fetchScheduledComments();
    }
    setIsSubmitting(false);
  };

  const handleScheduleSelect = (date: Date) => {
    setScheduledAt(date);
    setScheduleModalOpen(false);
  };

  const handleScheduleConfirm = () => {
    if (customDateTime) {
      const d = new Date(customDateTime);
      if (!isNaN(d.getTime()) && d > new Date()) {
        handleScheduleSelect(d);
        return;
      }
    }
    setScheduleModalOpen(false);
  };

  const handleRemind = async () => {
    await fetch(`/api/reports/${reportId}/remind`, { method: "POST" });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/reports");
      router.refresh();
    }
    setIsDeleting(false);
    setDeleteOpen(false);
  };

  const handleCommentClick = (c: Comment) => {
    setSelectedComment(c);
    setCommentMenuOpen(true);
  };

  const handleCommentCopy = async () => {
    if (!selectedComment) return;
    await navigator.clipboard.writeText(selectedComment.content);
    setNewComment(selectedComment.content);
    setCommentMenuOpen(false);
    setSelectedComment(null);
  };

  const handleCommentEdit = () => {
    if (!selectedComment) return;
    setEditingCommentId(selectedComment.id);
    setEditCommentContent(selectedComment.content);
    setCommentMenuOpen(false);
    setSelectedComment(null);
  };

  const handleCommentEditSave = async () => {
    if (!editingCommentId || !editCommentContent.trim()) return;
    const res = await fetch(
      `/api/reports/${reportId}/comments/${editingCommentId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editCommentContent.trim() }),
      }
    );
    if (res.ok) {
      fetchComments();
      setEditingCommentId(null);
      setEditCommentContent("");
    }
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleCommentDeleteClick = () => {
    setCommentMenuOpen(false);
    setCommentDeleteOpen(true);
  };

  const handleCommentDelete = async () => {
    if (!selectedComment) return;
    setIsCommentDeleting(true);
    const res = await fetch(
      `/api/reports/${reportId}/comments/${selectedComment.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      fetchComments();
      fetchScheduledComments();
      setSelectedComment(null);
      setCommentDeleteOpen(false);
    }
    setIsCommentDeleting(false);
  };

  const handleScheduledCancelClick = (s: ScheduledComment) => {
    setScheduledToCancel(s);
    setScheduledCancelOpen(true);
  };

  const handleScheduledCancelConfirm = async () => {
    if (!scheduledToCancel) return;
    const res = await fetch(
      `/api/reports/${reportId}/comments/${scheduledToCancel.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      fetchScheduledComments();
      setScheduledToCancel(null);
      setScheduledCancelOpen(false);
    }
  };

  if (isLoading || !profile) return null;

  if (isLoadingReport) {
    return (
      <div className="flex h-dvh flex-col bg-zinc-50">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
          <Link href="/reports" className="flex h-10 w-10 items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">알림장(상세)</h1>
          <div className="h-10 w-10" />
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-dvh flex-col bg-zinc-50">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
          <Link href="/reports" className="flex h-10 w-10 items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">알림장(상세)</h1>
          <div className="h-10 w-10" />
        </header>
        <main className="flex-1 px-4 py-6">
          <div className="rounded-lg bg-white p-6 text-center">
            <p className="text-zinc-600">알림장을 찾을 수 없습니다.</p>
            <Link href="/reports" className="mt-4 inline-block">
              <Button variant="outline">목록으로</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const headerActions =
    profile.role === "ADMIN" ? (
      <div className="flex items-center gap-1">
        {!report.isReadByGuardian && !report.isGuardianPost && (
          <button
            type="button"
            onClick={handleRemind}
            className="rounded px-2 py-1.5 text-sm font-medium text-white hover:bg-white/20"
          >
            재알림
          </button>
        )}
        {!report.isGuardianPost && (
          <>
            <Link
              href={`/reports/${reportId}/edit`}
              className="rounded px-2 py-1.5 text-sm font-medium text-white hover:bg-white/20"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              disabled={isDeleting}
              className="rounded px-2 py-1.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
            >
              삭제
            </button>
          </>
        )}
      </div>
    ) : (
      <div className="h-10 w-10" />
    );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-red-500 px-4 py-3">
        <Link href="/reports" className="flex h-10 w-10 items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-white">알림장(상세)</h1>
        {headerActions}
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            {/* 제목: 고정 (스크롤 안 됨) */}
            <div className="shrink-0 border-b border-zinc-100">
              <div className="flex items-start gap-3 p-4">
                {report.pet.photoUrl ? (
                  <img
                    src={report.pet.photoUrl}
                    alt={report.pet.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-2xl">
                    🐾
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-zinc-900">{report.pet.name}</h2>
                  <p className="text-sm text-zinc-500">
                    {report.author.name}
                    {report.isGuardianPost && " · 보호자의 글"}
                    {" · "}
                    {new Date(report.createdAt).toLocaleString("ko-KR")}
                  </p>
                  {profile.role === "GUARDIAN" && report.readAt && (
                    <p className="mt-1 text-xs text-zinc-400">
                      열람: {new Date(report.readAt).toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 스크롤 영역: 생활기록 → 이미지 → 내용 */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={contentScrollRef}
                onScroll={checkScrollArrow}
                className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
              >
              {/* 1. 생활기록 */}
              {report.dailyRecord &&
                ["mood", "health", "temperatureCheck", "mealStatus", "sleepTime", "bowelStatus"].some(
                  (k) => report.dailyRecord![k as keyof typeof report.dailyRecord]
                ) && (
                <div className="border-b border-zinc-100 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-700">생활기록</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {(["mood", "health", "temperatureCheck", "mealStatus", "sleepTime", "bowelStatus"] as const).map(
                      (key) => {
                        const val = report.dailyRecord?.[key];
                        if (!val) return null;
                        return (
                          <div key={key} className="flex gap-2">
                            <dt className="text-zinc-500">{DAILY_RECORD_TITLES[key]}</dt>
                            <dd className="text-zinc-900">{getDailyRecordLabel(key, val)}</dd>
                          </div>
                        );
                      }
                    )}
                  </dl>
                </div>
              )}

              {/* 2. 이미지 (Swiper) */}
              {report.media.length > 0 && (
                <div className="report-image-swiper border-b border-zinc-100 py-4">
                  <Swiper
                    modules={report.media.length > 1 ? [Pagination] : []}
                    spaceBetween={0}
                    slidesPerView={1}
                    pagination={report.media.length > 1 ? { clickable: true } : false}
                    className="!overflow-hidden"
                  >
                    {report.media.map((m, i) => (
                      <SwiperSlide key={m.id}>
                        <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                          <img
                            src={m.url}
                            alt={`첨부 ${i + 1}`}
                            className="h-full w-full object-cover"
                            draggable={false}
                            onLoad={checkScrollArrow}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}

              {/* 3. 내용 */}
              <div className="p-4">
                <div className="whitespace-pre-wrap text-zinc-700">{report.content}</div>
              </div>
              </div>
              {showScrollArrow && (
                <div
                  className="scroll-arrow-hint pointer-events-none absolute bottom-3 left-1/2 z-10 animate-bounce-down"
                  aria-hidden
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-zinc-600"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-[2] flex-col overflow-hidden rounded-lg bg-white p-4 shadow-sm">
            <h3 className="shrink-0 font-semibold text-zinc-900">
              댓글 {comments.length + scheduledComments.length}
            </h3>
            <div
              ref={commentListRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
            >
              <ul className="mt-4 space-y-5 pb-2">
              {[
                ...comments.map((c) => ({
                  ...c,
                  sortAt: c.scheduledAt || c.createdAt,
                  isScheduled: false,
                })),
                ...scheduledComments.map((s) => ({
                  ...s,
                  sortAt: s.scheduledAt,
                  isScheduled: true as const,
                })),
              ]
                .sort((a, b) => new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime())
                .map((item) => {
                  const c = item as (Comment & { sortAt: string; isScheduled: boolean }) | (ScheduledComment & { sortAt: string; isScheduled: true });
                  const isScheduled = c.isScheduled === true;
                  const isMine = c.author?.userId === profile?.userId;
                  const isEditing = !isScheduled && editingCommentId === c.id;
                  const displayDate = ("scheduledAt" in c && c.scheduledAt) ? c.scheduledAt : c.createdAt;
                  const timeStr = `${new Date(displayDate).getMonth() + 1}월 ${new Date(displayDate).getDate()}일 ${new Date(displayDate).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
                  const authorLabel =
                    c.author.role === "ADMIN" ? `${c.author.name} · 원장` : c.author.name;
                  const s = isScheduled ? (c as ScheduledComment) : null;

                  return (
                    <li
                      key={c.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`mb-1 flex w-full flex-wrap items-center gap-1 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-sm font-medium text-zinc-800">
                          {authorLabel}
                        </span>
                        {isScheduled && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                            예약
                          </span>
                        )}
                        <span className="text-xs text-zinc-500">{timeStr}</span>
                      </div>
                      {isEditing ? (
                        <div className="flex w-full max-w-[85%] flex-col gap-2">
                          <input
                            type="text"
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCommentEditCancel}
                            >
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCommentEditSave}
                              disabled={!editCommentContent.trim()}
                            >
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex max-w-[85%] flex-col gap-2">
                          <div
                            role={!isScheduled ? "button" : undefined}
                            tabIndex={!isScheduled ? 0 : undefined}
                            onClick={() => !isScheduled && handleCommentClick(c)}
                            onKeyDown={(e) =>
                              !isScheduled &&
                              (e.key === "Enter" || e.key === " ") &&
                              handleCommentClick(c)
                            }
                            className={`relative rounded-2xl px-4 py-2.5 ${
                              isScheduled
                                ? "border-2 border-dashed border-amber-300 bg-amber-50"
                                : isMine
                                  ? "bg-amber-300 text-zinc-900"
                                  : "bg-zinc-200 text-zinc-900"
                            } ${!isScheduled ? "cursor-pointer" : "cursor-default"} ${!isScheduled && isMine ? "active:bg-amber-400" : ""} ${!isScheduled && !isMine ? "active:bg-zinc-300" : ""}`}
                          >
                            {!isScheduled && isMine ? (
                              <span
                                className="absolute -top-2 left-3 h-0 w-0 border-b-[10px] border-l-[6px] border-r-[6px] border-t-0 border-b-amber-300 border-l-transparent border-r-transparent border-t-transparent"
                                aria-hidden
                              />
                            ) : !isScheduled ? (
                              <span
                                className="absolute -top-2 right-3 h-0 w-0 border-b-[10px] border-l-[6px] border-r-[6px] border-t-0 border-b-zinc-200 border-l-transparent border-r-transparent border-t-transparent"
                                aria-hidden
                              />
                            ) : null}
                            <p className="text-sm leading-relaxed">{c.content}</p>
                          </div>
                          {isScheduled && s && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduledCancelClick(s);
                              }}
                              className="self-end"
                            >
                              예약 취소
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {scheduledAt && (
              <div className="mt-4 flex shrink-0 items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span>예약: {formatScheduleLabel(scheduledAt)}</span>
                <button
                  type="button"
                  onClick={() => setScheduledAt(null)}
                  className="text-xs underline"
                >
                  취소
                </button>
              </div>
            )}
            <form
              onSubmit={handleSubmitComment}
              className="mt-6 flex shrink-0 items-center gap-2 border-t border-zinc-200 pt-4"
            >
              <button
                type="button"
                onClick={() => setScheduleModalOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
                title="예약 전송"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 남겨주세요."
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 disabled:opacity-50"
                title="전송"
              >
                {isSubmitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 4 19 12 5 20 5 4" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="알림장 삭제"
        description="이 알림장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={commentDeleteOpen}
        onOpenChange={(open) => {
          setCommentDeleteOpen(open);
          if (!open) setSelectedComment(null);
        }}
        title="댓글 삭제"
        description="이 댓글을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={handleCommentDelete}
      />

      <ConfirmDialog
        open={scheduledCancelOpen}
        onOpenChange={(open) => {
          setScheduledCancelOpen(open);
          if (!open) setScheduledToCancel(null);
        }}
        title="예약 취소"
        description="이 댓글 예약을 취소하시겠습니까? 취소된 댓글은 전송되지 않습니다."
        confirmText="예약 취소"
        cancelText="닫기"
        variant="danger"
        onConfirm={handleScheduledCancelConfirm}
      />

      {commentMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
          onClick={() => {
            setCommentMenuOpen(false);
            setSelectedComment(null);
          }}
        >
          <div
            className="w-full max-w-md space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl bg-white p-1">
              <button
                type="button"
                onClick={handleCommentCopy}
                className="flex w-full items-center justify-center py-4 text-base font-medium text-blue-600"
              >
                댓글 복사
              </button>
              {selectedComment?.author?.userId === profile?.userId && (
                <>
                  <div className="border-t border-zinc-100" />
                  <button
                    type="button"
                    onClick={handleCommentEdit}
                    className="flex w-full items-center justify-center py-4 text-base font-medium text-blue-600"
                  >
                    댓글 수정
                  </button>
                  <div className="border-t border-zinc-100" />
                  <button
                    type="button"
                    onClick={handleCommentDeleteClick}
                    className="flex w-full items-center justify-center py-4 text-base font-medium text-blue-600"
                  >
                    댓글 삭제
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setCommentMenuOpen(false);
                setSelectedComment(null);
              }}
              className="flex w-full items-center justify-center rounded-xl bg-white py-4 text-base font-medium text-blue-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {scheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setScheduleModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-zinc-900">
              예약시간 설정
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const presets = getPresetTimes();
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => handleScheduleSelect(presets.am1)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
                    >
                      <span className="text-2xl">☀️</span>
                      <span className="text-sm font-medium text-zinc-900">내일 오전</span>
                      <span className="text-xs text-zinc-500">
                        {formatScheduleLabel(presets.am1)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScheduleSelect(presets.am2)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
                    >
                      <span className="text-2xl">☀️</span>
                      <span className="text-sm font-medium text-zinc-900">내일 오전</span>
                      <span className="text-xs text-zinc-500">
                        {formatScheduleLabel(presets.am2)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScheduleSelect(presets.pm)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
                    >
                      <span className="text-2xl">☀️</span>
                      <span className="text-sm font-medium text-zinc-900">내일 오후</span>
                      <span className="text-xs text-zinc-500">
                        {formatScheduleLabel(presets.pm)}
                      </span>
                    </button>
                    {presets.last ? (
                      <button
                        type="button"
                        onClick={() => handleScheduleSelect(presets.last!)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
                      >
                        <span className="text-2xl">🕐</span>
                        <span className="text-sm font-medium text-zinc-900">
                          최근 예약 시간
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatScheduleLabel(presets.last)}
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                        <span className="text-xs text-zinc-400">최근 예약 없음</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">직접입력</span>
                <span className="text-sm text-zinc-500">날짜 및 시간 선택 &gt;</span>
              </div>
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900"
              />
            </div>
            <button
              type="button"
              onClick={handleScheduleConfirm}
              className="mt-4 w-full rounded-xl bg-zinc-700 py-3.5 font-medium text-white transition hover:bg-zinc-800"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
