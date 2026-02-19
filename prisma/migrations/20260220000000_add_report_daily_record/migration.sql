-- CreateTable
CREATE TABLE "report_daily_records" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "mood" TEXT,
    "health" TEXT,
    "temperature_check" TEXT,
    "meal_status" TEXT,
    "sleep_time" TEXT,
    "bowel_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_daily_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_daily_records_report_id_key" ON "report_daily_records"("report_id");

-- AddForeignKey
ALTER TABLE "report_daily_records" ADD CONSTRAINT "report_daily_records_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
