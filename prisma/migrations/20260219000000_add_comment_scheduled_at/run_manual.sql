-- Supabase SQL Editor에서 직접 실행 (마이그레이션 실패 시)
-- report_comments 테이블에 scheduled_at 컬럼 추가
ALTER TABLE "report_comments" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);
