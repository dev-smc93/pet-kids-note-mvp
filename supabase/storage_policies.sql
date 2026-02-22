-- Supabase Storage RLS 정책 (클라이언트 직접 업로드용)
-- Supabase 대시보드 > SQL Editor에서 실행
-- 버킷(report-photos, pet-photos)이 이미 생성되어 있어야 함
-- 기존 정책이 있으면 DROP POLICY 후 실행하거나, 대시보드에서 수동으로 추가

-- report-photos: 인증된 사용자가 자신의 폴더에만 업로드 가능
CREATE POLICY "Allow authenticated upload to own folder report-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- pet-photos: 인증된 사용자가 자신의 폴더에만 업로드 가능
CREATE POLICY "Allow authenticated upload to own folder pet-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
