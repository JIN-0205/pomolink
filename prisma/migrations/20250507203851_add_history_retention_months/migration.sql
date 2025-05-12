-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('TASK', 'SUBMISSION', 'SESSION_BONUS', 'PLANNER_BONUS');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "historyRetentionMonths" INTEGER;

-- CreateTable
CREATE TABLE "PointHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PointType" NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT,
    "relatedTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
