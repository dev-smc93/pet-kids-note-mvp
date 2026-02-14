import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/auth";

// GET: 내 반려동물 목록 (보호자)
export async function GET() {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const pets = await prisma.pet.findMany({
    where: { ownerUserId: profile!.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pets);
}

// POST: 반려동물 등록 (보호자)
export async function POST(request: Request) {
  const { profile, error } = await getAuthUser();
  if (error) return error;

  const body = await request.json();
  const { name, breed, photoUrl, note } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "반려동물 이름을 입력해주세요." },
      { status: 400 }
    );
  }

  const pet = await prisma.pet.create({
    data: {
      ownerUserId: profile!.userId,
      name: name.trim(),
      breed: typeof breed === "string" ? breed.trim() || null : null,
      photoUrl: typeof photoUrl === "string" ? photoUrl || null : null,
      note: typeof note === "string" ? note || null : null,
    },
  });

  return NextResponse.json(pet);
}
