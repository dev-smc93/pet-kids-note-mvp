import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

async function getPetWithAuth(petId: string, userId: string) {
  return prisma.pet.findFirst({
    where: {
      id: petId,
      ownerUserId: userId,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: petId } = await params;

  const pet = await getPetWithAuth(petId, profile!.userId);
  if (!pet) {
    return NextResponse.json({ error: "반려동물을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const { name, breed, photoUrl, note } = body;

  const updateData: {
    name?: string;
    breed?: string | null;
    photoUrl?: string | null;
    note?: string | null;
  } = {};
  if (typeof name === "string" && name.trim()) updateData.name = name.trim();
  if (typeof breed === "string") updateData.breed = breed.trim() || null;
  if ("photoUrl" in body) updateData.photoUrl = typeof photoUrl === "string" ? (photoUrl.trim() || null) : null;
  if (typeof note === "string") updateData.note = note || null;

  const updated = await prisma.pet.update({
    where: { id: petId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const { id: petId } = await params;

  const pet = await getPetWithAuth(petId, profile!.userId);
  if (!pet) {
    return NextResponse.json({ error: "반려동물을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.pet.delete({ where: { id: petId } });
  return NextResponse.json({ success: true });
}
