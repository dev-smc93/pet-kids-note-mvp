"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GuardianPetFormProps {
  pet?: {
    id: string;
    name: string;
    breed: string | null;
    photoUrl: string | null;
    note: string | null;
  };
}

function PetDeleteButton({
  petId,
  petName,
}: {
  petId: string;
  petName: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`"${petName}"를(을) 삭제하시겠습니까?`)) return;
    setIsDeleting(true);
    const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/my-pets");
      router.refresh();
    }
    setIsDeleting(false);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleDelete}
      isLoading={isDeleting}
      className="mt-2 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      삭제
    </Button>
  );
}

export function GuardianPetForm({ pet }: GuardianPetFormProps) {
  const [name, setName] = useState(pet?.name ?? "");
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [note, setNote] = useState(pet?.note ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(pet?.photoUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(pet?.photoUrl ?? null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(photoUrl);
  }, [selectedFile, photoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("JPEG, PNG, WebP 형식만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setPhotoUrl(null);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoUrl(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("반려동물 이름을 입력해주세요.");
      return;
    }
    setIsLoading(true);

    let finalPhotoUrl: string | null = photoUrl;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload/pet-photo", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "사진 업로드에 실패했습니다.");
        setIsLoading(false);
        return;
      }
      finalPhotoUrl = uploadData.url;
    }

    const url = pet ? `/api/pets/${pet.id}` : "/api/pets";
    const method = pet ? "PATCH" : "POST";
    const body = {
      name: name.trim(),
      breed: breed.trim() || null,
      photoUrl: finalPhotoUrl,
      note: note.trim() || null,
    };

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

    router.push("/my-pets");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">
        {pet ? "반려동물 수정" : "반려동물 등록"}
      </h1>
      <p className="text-sm text-zinc-600">
        반려동물을 등록한 후, 원을 검색해 연결 요청을 보내세요.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Input
        label="이름"
        placeholder="반려동물 이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="품종 (선택)"
        placeholder="예: 골든 리트리버"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
      />

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          사진 (선택)
        </label>
        <div className="flex flex-col items-center gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-zinc-400 hover:bg-zinc-100"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="미리보기"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl text-zinc-400">🐾</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm px-3 py-2"
            >
              {previewUrl ? "사진 변경" : "사진 선택"}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemovePhoto}
                className="text-sm px-3 py-2 text-zinc-500"
              >
                사진 제거
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          특이사항 (선택)
        </label>
        <textarea
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="알레르기, 주의사항 등"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/my-pets" className="flex-1">
          <Button type="button" variant="outline" fullWidth>
            취소
          </Button>
        </Link>
        <Button type="submit" fullWidth isLoading={isLoading}>
          {pet ? "저장" : "등록"}
        </Button>
      </div>

      {pet && <PetDeleteButton petId={pet.id} petName={pet.name} />}
    </form>
  );
}
