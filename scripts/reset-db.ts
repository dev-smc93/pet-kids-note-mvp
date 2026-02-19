/**
 * Supabase DB 데이터 초기화 + 시드 실행
 * migrate reset 대신 사용 (Supabase는 전체 DB 삭제 불가)
 *
 * 사용법: npm run db:reset
 */
import "dotenv/config";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL이 설정되지 않았습니다.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TABLES = [
  "report_reads",
  "report_comments",
  "report_daily_records",
  "report_media",
  "reports",
  "memberships",
  "pets",
  "groups",
  "profiles",
] as const;

async function main() {
  console.log("🗑️  데이터 초기화 중...");

  // 존재하는 테이블만 TRUNCATE (마이그레이션 미적용 시 일부 테이블 없을 수 있음)
  const tableList = TABLES.map((t) => `'${t}'`).join(", ");
  const existing = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (${tableList})`
  );
  const toTruncate = existing.map((r) => r.tablename);

  if (toTruncate.length > 0) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${toTruncate.map((t) => `"${t}"`).join(", ")} CASCADE`
    );
  }
  console.log(`✅ 데이터 초기화 완료 (${toTruncate.length}개 테이블)`);
  await prisma.$disconnect();

  console.log("\n🌱 시드 데이터 적용 중...");
  execSync("npm run db:seed", { stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
