/**
 * groups 테이블 중복 제거
 * (name, sido, sigungu, address) 동일한 원 중 가장 먼저 생성된 것만 유지
 * 삭제 대상 원의 memberships는 유지 원으로 이전 (충돌 시 삭제)
 *
 * 사용법: npm run db:dedupe-groups
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL이 설정되지 않았습니다.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function groupKey(g: { name: string; sido: string; sigungu: string; address: string }) {
  return `${g.name}|${g.sido}|${g.sigungu}|${g.address}`;
}

async function main() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "asc" },
    include: { memberships: true },
  });

  const byKey = new Map<string, typeof groups>();
  for (const g of groups) {
    const key = groupKey(g);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(g);
  }

  let deleted = 0;
  for (const [, dupes] of byKey) {
    if (dupes.length <= 1) continue;

    const [keep, ...toDelete] = dupes;
    console.log(`중복: "${keep.name}" (${keep.sido} ${keep.sigungu} ${keep.address}) - ${dupes.length}건 → 1건 유지`);

    for (const g of toDelete) {
      for (const m of g.memberships) {
        const existing = await prisma.membership.findUnique({
          where: {
            userId_groupId_petId: {
              userId: m.userId,
              groupId: keep.id,
              petId: m.petId,
            },
          },
        });
        if (existing) {
          await prisma.membership.delete({ where: { id: m.id } });
        } else {
          await prisma.membership.update({
            where: { id: m.id },
            data: { groupId: keep.id },
          });
        }
      }
      await prisma.group.delete({ where: { id: g.id } });
      deleted++;
    }
  }

  console.log(`\n완료: ${deleted}건 중복 원 삭제`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
