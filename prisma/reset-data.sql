-- Supabase DB 데이터 초기화 (스키마는 유지)
-- Supabase SQL Editor에서 실행하거나: psql $DATABASE_URL -f prisma/reset-data.sql

TRUNCATE TABLE
  report_reads,
  report_comments,
  report_daily_records,
  report_media,
  reports,
  memberships,
  pets,
  groups,
  profiles
CASCADE;
