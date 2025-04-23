/*
  Warnings:

  - Added the required column `visitId` to the `PomoSession` table without a default value. This is not possible if the table is not empty.

*/
-- 1. visitIdをNULL許容で追加
ALTER TABLE "PomoSession" ADD COLUMN "visitId" TEXT;

-- 2. Visitテーブルを作成
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- 3. 既存のPomoSessionごとにVisitを作成し、visitIdを埋める
-- 例: SQLで一括生成（PostgreSQLの場合）
INSERT INTO "Visit" ("id", "startTime", "endTime", "createdAt", "userId", "taskId")
SELECT gen_random_uuid(), "startTime", "endTime", NOW(), '既定のuserId', "taskId" FROM "PomoSession" WHERE "visitId" IS NULL;

-- 4. PomoSessionのvisitIdを上記で作成したVisitのidで埋める
-- ここはスクリプトや手動で対応が必要です

-- 5. 外部キー制約を追加
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PomoSession" ADD CONSTRAINT "PomoSession_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. 最後にvisitIdをNOT NULLに
ALTER TABLE "PomoSession" ALTER COLUMN "visitId" SET NOT NULL;