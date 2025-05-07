-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "taskId" TEXT;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
