-- Drop dependent tables (order matters for FK)
DROP TABLE IF EXISTS "report_media";
DROP TABLE IF EXISTS "report_reads";
DROP TABLE IF EXISTS "reports";
DROP TABLE IF EXISTS "memberships";
DROP TABLE IF EXISTS "invite_codes";
DROP TABLE IF EXISTS "pets";

-- AlterTable: groups - add sido, sigungu, address
ALTER TABLE "groups" ADD COLUMN "sido" TEXT NOT NULL DEFAULT '서울특별시';
ALTER TABLE "groups" ADD COLUMN "sigungu" TEXT NOT NULL DEFAULT '';
ALTER TABLE "groups" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable: pets (보호자 소유, 품종 포함)
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "photo_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: memberships (status 포함)
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "memberships_user_id_group_id_pet_id_key" ON "memberships"("user_id", "group_id", "pet_id");

-- CreateTable: reports
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "reports" ADD CONSTRAINT "reports_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: report_media
CREATE TABLE "report_media" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_media_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "report_media" ADD CONSTRAINT "report_media_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: report_reads
CREATE TABLE "report_reads" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_reads_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "report_reads" ADD CONSTRAINT "report_reads_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_reads" ADD CONSTRAINT "report_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "report_reads_report_id_user_id_key" ON "report_reads"("report_id", "user_id");
