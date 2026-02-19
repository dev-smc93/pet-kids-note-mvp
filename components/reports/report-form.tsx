"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PetOption {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
  /** 보호자(부모) 이름 */
  ownerName?: string;
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
  /** 작성 완료 후 이동할 URL (미지정 시 /groups/{groupId}) */
  successRedirect?: string;
  /** 하단 취소/작성 버튼 숨김 (상위에서 세그먼트 버튼 등으로 대체 시) */
  hideActions?: boolean;
  /** form id (외부 submit 버튼 연동용) */
  formId?: string;
  /** 로딩 상태 변경 시 콜백 (외부 버튼 비활성화용) */
  onLoadingChange?: (loading: boolean) => void;
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
  successRedirect,
  hideActions,
  formId,
  onLoadingChange,
}: ReportFormProps) {
  const isEdit = !!report;
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(
    report ? [report.pet.id] : []
  );

  const togglePet = (id: string) => {
    if (isEdit) return;
    setSelectedPetIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const [content, setContent] = useState(report?.content ?? "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    report?.media.map((m) => m.url) ?? []
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const petDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (petDropdownRef.current && !petDropdownRef.current.contains(e.target as Node)) {
        setIsPetDropdownOpen(false);
      }
    };
    if (isPetDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPetDropdownOpen]);

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
    if (!isEdit && selectedPetIds.length === 0) {
      setError("대상 반려동물을 1마리 이상 선택해주세요.");
      return;
    }

    setIsLoading(true);
    onLoadingChange?.(true);

    if (isEdit) {
      const res = await fetch(`/api/reports/${report!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), mediaUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        setIsLoading(false);
        onLoadingChange?.(false);
        return;
      }
      window.location.href = `/reports/${report!.id}`;
      return;
    }

    // 다중 선택 시 선택된 petId마다 알림장 생성
    let lastError = "";
    for (const petId of selectedPetIds) {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId,
          content: content.trim(),
          mediaUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        lastError = data.error ?? "저장에 실패했습니다.";
      }
    }

    if (lastError) {
      setError(lastError);
      setIsLoading(false);
      onLoadingChange?.(false);
      return;
    }

    window.location.href = successRedirect ?? `/groups/${groupId}`;
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4"
    >
      {isEdit && (
        <h1 className="text-xl font-semibold text-zinc-900">알림장 수정</h1>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {!isEdit && pets.length > 0 && (
        <div ref={petDropdownRef} className="relative w-full">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            대상 반려동물 (다중 선택 가능)
          </label>
          <button
            type="button"
            onClick={() => setIsPetDropdownOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-4 py-3 text-left text-base text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <span className={selectedPetIds.length === 0 ? "text-zinc-400" : ""}>
              {selectedPetIds.length === 0
                ? "선택하세요"
                : selectedPetIds.length === 1
                  ? pets.find((p) => p.id === selectedPetIds[0])?.name ?? "선택됨"
                  : `${selectedPetIds.length}마리 선택됨`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`flex-shrink-0 text-zinc-500 transition-transform ${isPetDropdownOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isPetDropdownOpen && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
              {pets.map((p) => {
                const checked = selectedPetIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <label
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                      onClick={() => togglePet(p.id)}
                    >
                      <span className="flex-shrink-0">
                        {checked ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-300" />
                        )}
                      </span>
                      <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-zinc-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span className="flex-1 text-sm text-zinc-900">
                        {p.name}
                        {p.ownerName ? ` (부모: ${p.ownerName})` : ""}
                        {p.breed ? ` · ${p.breed}` : ""}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
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

      {!hideActions && (
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
      )}
    </form>
  );
}
