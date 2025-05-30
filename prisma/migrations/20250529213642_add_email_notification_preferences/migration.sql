-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailDailyReminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailInvitations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailMaintenance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailPomodoroComplete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailSessionSummary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailWeeklyReports" BOOLEAN NOT NULL DEFAULT false;
