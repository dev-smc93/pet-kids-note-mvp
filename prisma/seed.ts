import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const seedAdminId = process.env.SEED_USER_ID;
  const seedGuardianId = process.env.SEED_GUARDIAN_USER_ID;

  if (!seedAdminId) {
    throw new Error(
      "SEED_USER_ID가 설정되지 않았습니다. Supabase Auth에서 관리자 테스트 계정을 생성한 뒤, 해당 user_id를 .env에 SEED_USER_ID로 추가하세요."
    );
  }
  if (!seedGuardianId) {
    throw new Error(
      "SEED_GUARDIAN_USER_ID가 설정되지 않았습니다. Supabase Auth에서 보호자 테스트 계정을 생성한 뒤, 해당 user_id를 .env에 SEED_GUARDIAN_USER_ID로 추가하세요."
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL가 설정되지 않았습니다.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Profile (관리자)
    const adminProfile = await prisma.profile.upsert({
      where: { userId: seedAdminId },
      create: {
        userId: seedAdminId,
        role: "ADMIN",
        name: "시드 관리자",
      },
      update: {},
    });
    console.log("✅ Profile(관리자) 생성/확인:", adminProfile.name);

    // 2. Profile (보호자)
    const guardianProfile = await prisma.profile.upsert({
      where: { userId: seedGuardianId },
      create: {
        userId: seedGuardianId,
        role: "GUARDIAN",
        name: "시드 보호자",
      },
      update: {},
    });
    console.log("✅ Profile(보호자) 생성/확인:", guardianProfile.name);

    // 3. Group (원 - 관리자 소유)
    let group = await prisma.group.findFirst({
      where: { ownerUserId: adminProfile.userId, name: "해피펫 유치원" },
    });
    if (!group) {
      group = await prisma.group.create({
        data: {
          name: "해피펫 유치원",
          ownerUserId: adminProfile.userId,
          sido: "서울특별시",
          sigungu: "강남구",
          address: "테스트 주소 123",
        },
      });
    }
    console.log("✅ Group 생성/확인:", group.name);

    // 4. Pet (반려동물 - 보호자 소유)
    let pet = await prisma.pet.findFirst({
      where: { ownerUserId: guardianProfile.userId, name: "초코" },
    });
    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          ownerUserId: guardianProfile.userId,
          name: "초코",
          breed: "골든 리트리버",
          note: "알레르기 있음 (닭고기)",
        },
      });
    }
    console.log("✅ Pet 생성/확인:", pet.name);

    // 5. Membership (보호자-원-반려동물 연결, 승인됨)
    await prisma.membership.upsert({
      where: {
        userId_groupId_petId: {
          userId: guardianProfile.userId,
          groupId: group.id,
          petId: pet.id,
        },
      },
      create: {
        userId: guardianProfile.userId,
        groupId: group.id,
        petId: pet.id,
        status: "APPROVED",
      },
      update: { status: "APPROVED" },
    });
    console.log("✅ Membership 생성/확인");

    // 6. Report (알림장 - 관리자 작성)
    let report = await prisma.report.findFirst({
      where: { petId: pet.id, authorUserId: adminProfile.userId },
    });
    if (!report) {
      report = await prisma.report.create({
        data: {
          petId: pet.id,
          authorUserId: adminProfile.userId,
          content:
            "오늘 산책 잘 다녀왔어요. 점심 식사도 잘 했고, 오후에는 낮잠을 잤습니다. 특이사항 없습니다.",
        },
      });
    }
    console.log("✅ Report 생성/확인:", report.id);

    console.log("\n🎉 시드 데이터 적용 완료!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
