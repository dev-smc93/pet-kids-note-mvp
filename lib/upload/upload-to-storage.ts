import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export type UploadResult = { url: string } | { error: string };

export async function uploadToStorage(
  supabase: SupabaseClient,
  bucket: "report-photos" | "pet-photos",
  userId: string,
  file: File
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "JPEG, PNG, WebP 형식만 업로드 가능합니다." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "파일 크기는 10MB 이하여야 합니다." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Upload error:", error);
    return { error: "업로드에 실패했습니다." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: publicUrl };
}
