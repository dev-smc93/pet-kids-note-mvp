-- Supabase Realtime: report_comments 테이블 변경 구독 활성화
-- Supabase 대시보드 > SQL Editor에서 실행하거나, Database > Publications > supabase_realtime에서 테이블 추가

ALTER PUBLICATION supabase_realtime ADD TABLE report_comments;
