-- AlterTable
ALTER TABLE "User" ADD COLUMN     "breakAlarmSound" TEXT NOT NULL DEFAULT 'kalimba',
ADD COLUMN     "workAlarmSound" TEXT NOT NULL DEFAULT 'buzzer';
