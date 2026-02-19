import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// --- 랜덤 유틸 ---
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 이전 3~4개월 내 랜덤 날짜 */
function randomDateWithinMonths(monthsBack: number): Date {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - monthsBack);
  const randomTime = start.getTime() + Math.random() * (now.getTime() - start.getTime());
  return new Date(randomTime);
}

// --- 시드 데이터 풀 ---
const GROUP_TEMPLATES = [
  { name: "해피펫 유치원", sido: "서울특별시", sigungu: "강남구", address: "테스트 주소 123" },
  { name: "해피펫 유치원 부산점", sido: "부산광역시", sigungu: "해운대구", address: "테스트 주소 456" },
  { name: "해피펫 유치원 대구점", sido: "대구광역시", sigungu: "수성구", address: "테스트 주소 789" },
  { name: "해피펫 유치원 인천점", sido: "인천광역시", sigungu: "연수구", address: "테스트 주소 101" },
  { name: "해피펫 유치원 분당점", sido: "경기도", sigungu: "분당구", address: "테스트 주소 202" },
  { name: "해피펫 유치원 광주점", sido: "광주광역시", sigungu: "상무동", address: "테스트 주소 303" },
  { name: "사랑방 펫케어", sido: "서울특별시", sigungu: "서초구", address: "테스트 주소 404" },
  { name: "포레스트 독스쿨", sido: "경기도", sigungu: "성남시", address: "테스트 주소 505" },
];

const PET_NAMES = [
  "초코", "루미", "뽀미", "콩이", "달이", "별이", "하늘이", "꼬미", "토리", "루시",
  "맥스", "코코", "밀키", "버키", "찰스", "맨디", "미미", "나비", "토토", "모리",
  "누리", "보리", "해리", "구름이", "바다", "산이", "강이", "초롱이", "똘이", "복실이",
];

const BREEDS = ["골든 리트리버", "푸들", "닥스훈트", "웰시코기", "치와와", "말티즈", "비숑", "포메라니안"];

const REPORT_CONTENTS = [
  "오늘 산책 잘 다녀왔어요. 점심 식사도 잘 했고, 오후에는 낮잠을 잤습니다. 특이사항 없습니다.",
  "오늘 기분이 좋아 보였어요. 산책 후 물도 잘 마셨습니다.",
  "오늘은 조금 피곤해 보였지만 밥은 잘 먹었어요.",
  "활발하게 놀았습니다. 특이사항 없어요.",
];

const DAILY_RECORD_VALUES = {
  mood: ["좋음", "보통", "나쁨"],
  health: ["좋음", "보통", "나쁨"],
  temperatureCheck: ["정상", "미열", "고열"],
  mealStatus: ["정량", "많이", "적게", "안했음"],
  sleepTime: ["잠을 안 잤음", "1시간 미만", "1~2시간", "2시간 이상"],
  bowelStatus: ["보통", "딱딱함", "묽음", "설사", "안했음"],
};

const COMMENT_CONTENTS = [
  "네, 확인했습니다. 감사해요!",
  "알겠습니다. 다음에 또 알려주세요.",
  "잘 봤어요. 덕분에 안심이 됩니다.",
  "감사합니다. 잘 부탁드려요.",
];

function parseIds(envValue: string | undefined): string[] {
  const raw = (envValue ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const adminIds = parseIds(process.env.SEED_USER_ID);
  const guardianIds = parseIds(process.env.SEED_GUARDIAN_USER_ID);

  if (adminIds.length === 0) {
    throw new Error(
      "SEED_USER_ID가 설정되지 않았습니다. Supabase Auth에서 관리자 테스트 계정을 생성한 뒤, 해당 user_id를 .env에 SEED_USER_ID로 추가하세요. (여러 계정: 콤마로 구분)"
    );
  }
  if (guardianIds.length === 0) {
    throw new Error(
      "SEED_GUARDIAN_USER_ID가 설정되지 않았습니다. Supabase Auth에서 보호자 테스트 계정을 생성한 뒤, 해당 user_id를 .env에 SEED_GUARDIAN_USER_ID로 추가하세요. (여러 계정: 콤마로 구분)"
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL가 설정되지 않았습니다.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Profiles (관리자)
    const adminProfiles: { userId: string; name: string }[] = [];
    for (let i = 0; i < adminIds.length; i++) {
      const userId = adminIds[i];
      const name = adminIds.length === 1 ? "시드 관리자" : `시드 관리자${i + 1}`;
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, role: "ADMIN", name },
        update: {},
      });
      adminProfiles.push({ userId, name });
    }
    console.log(`✅ Profile(관리자) 생성/확인: ${adminProfiles.length}명`);

    // 2. Profiles (보호자)
    const guardianProfiles: { userId: string; name: string }[] = [];
    for (let i = 0; i < guardianIds.length; i++) {
      const userId = guardianIds[i];
      const name = guardianIds.length === 1 ? "시드 보호자" : `시드 보호자${i + 1}`;
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, role: "GUARDIAN", name },
        update: {},
      });
      guardianProfiles.push({ userId, name });
    }
    console.log(`✅ Profile(보호자) 생성/확인: ${guardianProfiles.length}명`);

    // 3. Groups (원 - 관리자당 1~2개 랜덤)
    const allGroups: { id: string; ownerUserId: string }[] = [];
    for (const admin of adminProfiles) {
      const count = randomInt(1, 2);
      const picked = shuffle(GROUP_TEMPLATES).slice(0, count);
      for (const g of picked) {
        let group = await prisma.group.findFirst({
          where: { ownerUserId: admin.userId, name: g.name },
        });
        if (!group) {
          group = await prisma.group.create({
            data: {
              name: g.name,
              ownerUserId: admin.userId,
              sido: g.sido,
              sigungu: g.sigungu,
              address: g.address,
            },
          });
        }
        allGroups.push({ id: group.id, ownerUserId: admin.userId });
      }
    }
    if (allGroups.length === 0) throw new Error("원이 하나도 생성되지 않았습니다.");
    console.log(`✅ Groups 생성/확인: ${allGroups.length}개 (관리자당 1~2개)`);

    // 4. Pet + Membership (보호자당 1~3개 반려동물, 랜덤 이름)
    const usedPetNames = new Set<string>();
    const memberships: { groupId: string; petId: string; guardianUserId: string; adminUserId: string }[] = [];

    for (let i = 0; i < guardianProfiles.length; i++) {
      const guardian = guardianProfiles[i];
      const petCount = randomInt(1, 3);
      const availableNames = PET_NAMES.filter((n) => !usedPetNames.has(n));
      const chosenNames = shuffle(availableNames).slice(0, petCount);

      for (const petName of chosenNames) {
        usedPetNames.add(petName);

        let pet = await prisma.pet.findFirst({
          where: { ownerUserId: guardian.userId, name: petName },
        });
        if (!pet) {
          pet = await prisma.pet.create({
            data: {
              ownerUserId: guardian.userId,
              name: petName,
              breed: pickRandom(BREEDS),
              note: randomBool(0.3) ? "알레르기 있음 (닭고기)" : undefined,
            },
          });
        }

        const group = pickRandom(allGroups);
        await prisma.membership.upsert({
          where: {
            userId_groupId_petId: {
              userId: guardian.userId,
              groupId: group.id,
              petId: pet.id,
            },
          },
          create: {
            userId: guardian.userId,
            groupId: group.id,
            petId: pet.id,
            status: "APPROVED",
          },
          update: { status: "APPROVED" },
        });
        memberships.push({
          groupId: group.id,
          petId: pet.id,
          guardianUserId: guardian.userId,
          adminUserId: group.ownerUserId,
        });
      }
    }
    console.log(`✅ Pet/Membership 생성/확인: 보호자당 1~3개 반려동물`);

    // 5. Report (멤버십당 1~3개) + 생활기록 랜덤 + 댓글 랜덤 + 읽음 랜덤
    for (const m of memberships) {
      const reportCount = randomInt(1, 3);
      for (let r = 0; r < reportCount; r++) {
        const reportDate = randomDateWithinMonths(randomInt(3, 4));
        const report = await prisma.report.create({
          data: {
            petId: m.petId,
            authorUserId: m.adminUserId,
            content: pickRandom(REPORT_CONTENTS),
            createdAt: reportDate,
            updatedAt: reportDate,
          },
        });

        // 생활기록 랜덤
        if (randomBool(0.5)) {
          await prisma.reportDailyRecord.create({
            data: {
              reportId: report.id,
              mood: pickRandom(DAILY_RECORD_VALUES.mood),
              health: pickRandom(DAILY_RECORD_VALUES.health),
              temperatureCheck: pickRandom(DAILY_RECORD_VALUES.temperatureCheck),
              mealStatus: pickRandom(DAILY_RECORD_VALUES.mealStatus),
              sleepTime: pickRandom(DAILY_RECORD_VALUES.sleepTime),
              bowelStatus: pickRandom(DAILY_RECORD_VALUES.bowelStatus),
            },
          });
        }

        // 댓글 랜덤 (0~2개)
        const commentCount = randomInt(0, 2);
        for (let c = 0; c < commentCount; c++) {
          const authorId = randomBool(0.5) ? m.adminUserId : m.guardianUserId;
          await prisma.reportComment.create({
            data: {
              reportId: report.id,
              authorUserId: authorId,
              content: pickRandom(COMMENT_CONTENTS),
            },
          });
        }

        // 읽음 처리 랜덤 (보호자)
        if (randomBool(0.6)) {
          await prisma.reportRead.upsert({
            where: {
              reportId_userId: { reportId: report.id, userId: m.guardianUserId },
            },
            create: { reportId: report.id, userId: m.guardianUserId },
            update: {},
          });
        }
      }
    }
    console.log(`✅ Report/생활기록/댓글/읽음 생성/확인 (랜덤)`);

    console.log("\n🎉 시드 데이터 적용 완료!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
