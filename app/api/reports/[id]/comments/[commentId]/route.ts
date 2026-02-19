import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

async function getCommentWithAuth(commentId: string, reportId: string, userId: string) {
  const comment = await prisma.reportComment.findFirst({
    where: { id: commentId, reportId },
    include: { report: { include: { pet: true } } },
  });
  if (!comment) return null;
  if (comment.authorUserId !== userId) return null;
  return comment;
}

// PATCH: 댓글 수정 (본인만)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: reportId, commentId } = await params;

  const comment = await getCommentWithAuth(commentId, reportId, profile!.userId);
  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없거나 수정 권한이 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const content = body?.content;

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json(
      { error: "댓글 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const updated = await prisma.reportComment.update({
    where: { id: commentId },
    data: { content: content.trim() },
    include: { author: { select: { userId: true, name: true, role: true } } },
  });

  return NextResponse.json(updated);
}

// DELETE: 댓글 삭제 (본인만)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: reportId, commentId } = await params;

  const comment = await getCommentWithAuth(commentId, reportId, profile!.userId);
  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없거나 삭제 권한이 없습니다." }, { status: 404 });
  }

  await prisma.reportComment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
