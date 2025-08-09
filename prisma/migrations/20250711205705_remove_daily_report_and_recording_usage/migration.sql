/*
  Warnings:

  - You are about to drop the column `dailyReportId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `dailyReportId` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the `DailyReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecordingUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DailyReport" DROP CONSTRAINT "DailyReport_userId_fkey";

-- DropForeignKey
ALTER TABLE "RecordingUsage" DROP CONSTRAINT "RecordingUsage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "RecordingUsage" DROP CONSTRAINT "RecordingUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_dailyReportId_fkey";

-- DropForeignKey
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_dailyReportId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "dailyReportId";

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "dailyReportId";

-- DropTable
DROP TABLE "DailyReport";

-- DropTable
DROP TABLE "RecordingUsage";
