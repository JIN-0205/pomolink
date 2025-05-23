/*
  Warnings:

  - Added the required column `roomId` to the `PointHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PointHistory" ADD COLUMN     "roomId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
