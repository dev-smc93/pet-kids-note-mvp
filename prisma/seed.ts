import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const seedUserId = process.env.SEED_USER_ID;
  if (!seedUserId) {
    throw new Error(
      "SEED_USER_ID가 설정되지 않았습니다. Supabase Auth에서 테스트 계정을 생성한 뒤, 해당 user_id를 .env에 SEED_USER_ID로 추가하세요."
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL가 설정되지 않았습니다.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Profile (Supabase Auth user_id와 연동)
    const profile = await prisma.profile.upsert({
      where: { userId: seedUserId },
      create: {
        userId: seedUserId,
        role: "ADMIN",
        name: "시드 관리자",
      },
      update: {},
    });
    console.log("✅ Profile 생성/확인:", profile.name);

    // 2. Group (반)
    let group = await prisma.group.findFirst({
      where: { ownerUserId: profile.userId, name: "A반" },
    });
    if (!group) {
      group = await prisma.group.create({
        data: {
          name: "A반",
          ownerUserId: profile.userId,
        },
      });
    }
    console.log("✅ Group 생성/확인:", group.name);

    // 3. Pet (반려동물)
    let pet = await prisma.pet.findFirst({
      where: { groupId: group.id, name: "초코" },
    });
    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          groupId: group.id,
          name: "초코",
          note: "알레르기 있음 (닭고기)",
        },
      });
    }
    console.log("✅ Pet 생성/확인:", pet.name);

    // 4. Report (알림장)
    let report = await prisma.report.findFirst({
      where: { petId: pet.id, authorUserId: profile.userId },
    });
    if (!report) {
      report = await prisma.report.create({
        data: {
          petId: pet.id,
          authorUserId: profile.userId,
          content:
            "오늘 산책 잘 다녀왔어요. 점심 식사도 잘 했고, 오후에는 낮잠을 잤습니다. 특이사항 없습니다.",
        },
      });
    }
    console.log("✅ Report 생성/확인:", report.id);

    // 5. InviteCode (초대코드 - 7일 유효)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.inviteCode.upsert({
      where: { code: "SEED-INVITE-001" },
      create: {
        code: "SEED-INVITE-001",
        groupId: group.id,
        petId: pet.id,
        expiresAt,
      },
      update: { expiresAt },
    });
    console.log("✅ InviteCode 생성/확인: SEED-INVITE-001");

    console.log("\n🎉 시드 데이터 적용 완료!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
