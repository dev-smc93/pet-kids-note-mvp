"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PetOption {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
}

interface ReportFormProps {
  groupId: string;
  pets: PetOption[];
  report?: {
    id: string;
    content: string;
    media: { id: string; url: string }[];
    pet: { id: string; name: string };
  };
  backHref: string;
  backLabel: string;
}

const MAX_CONTENT = 5000;
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 10;

export function ReportForm({
  groupId,
  pets,
  report,
  backHref,
  backLabel,
}: ReportFormProps) {
  const isEdit = !!report;
  const [petId, setPetId] = useState(report?.pet.id ?? (pets[0]?.id ?? ""));
  const [content, setContent] = useState(report?.content ?? "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    report?.media.map((m) => m.url) ?? []
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowed.includes(file.type)) {
        setError("JPEG, PNG, WebP 형식만 업로드 가능합니다.");
        return;
      }
      if (file.size > maxSize) {
        setError("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/report-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      newUrls.push(data.url);
    }

    const combined = [...mediaUrls, ...newUrls].slice(0, MAX_PHOTOS);
    setMediaUrls(combined);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    if (content.length > MAX_CONTENT) {
      setError(`내용은 ${MAX_CONTENT}자 이하여야 합니다.`);
      return;
    }
    if (mediaUrls.length > 0 && (mediaUrls.length < MIN_PHOTOS || mediaUrls.length > MAX_PHOTOS)) {
      setError(`사진은 ${MIN_PHOTOS}~${MAX_PHOTOS}장까지 첨부 가능합니다.`);
      return;
    }
    if (!isEdit && !petId) {
      setError("대상 반려동물을 선택해주세요.");
      return;
    }

    setIsLoading(true);

    const url = isEdit ? `/api/reports/${report!.id}` : "/api/reports";
    const method = isEdit ? "PATCH" : "POST";
    const body = isEdit
      ? { content: content.trim(), mediaUrls }
      : { petId, content: content.trim(), mediaUrls };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다.");
      setIsLoading(false);
      return;
    }

    if (isEdit) {
      window.location.href = `/reports/${report!.id}`;
    } else {
      window.location.href = `/groups/${groupId}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">
        {isEdit ? "알림장 수정" : "알림장 작성"}
      </h1>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {!isEdit && (
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            대상 반려동물
          </label>
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">선택하세요</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.breed ? ` (${p.breed})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {isEdit && (
        <p className="text-sm text-zinc-500">
          대상: {report?.pet.name}
        </p>
      )}

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘의 돌봄 내용을 입력해주세요."
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          rows={6}
          maxLength={MAX_CONTENT}
        />
        <p className="mt-1 text-right text-xs text-zinc-500">
          {content.length}/{MAX_CONTENT}
        </p>
      </div>

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          사진 (선택, 3~10장)
        </label>
        <div className="flex flex-wrap gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative">
              <img
                src={url}
                alt={`첨부 ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
              >
                ×
              </button>
            </div>
          ))}
          {mediaUrls.length < MAX_PHOTOS && (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 text-2xl text-zinc-400 hover:border-zinc-400">
              +
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {mediaUrls.length}장 / 최대 {MAX_PHOTOS}장
        </p>
      </div>

      <div className="flex gap-3">
        <Link href={backHref} className="flex-1">
          <Button type="button" variant="outline" fullWidth>
            취소
          </Button>
        </Link>
        <div className="flex-1">
          <Button type="submit" fullWidth isLoading={isLoading}>
            {isEdit ? "저장" : "작성"}
          </Button>
        </div>
      </div>
    </form>
  );
}
