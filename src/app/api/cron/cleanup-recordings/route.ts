import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // Vercel Cronジョブからのリクエストを検証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 期限切れの録画を特定
    const expiredRecordings = await prisma.recordingUsage.findMany({
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    const currentDate = new Date();
    const recordingsToDelete = expiredRecordings.filter((recording) => {
      if (!recording.user.subscription) return false;

      const retentionDays = recording.user.subscription.recordingRetentionDays;
      const expirationDate = new Date(recording.createdAt);
      expirationDate.setDate(expirationDate.getDate() + retentionDays);

      return currentDate > expirationDate;
    });

    // 録画ファイルの削除とデータベースからの削除
    let deletedCount = 0;
    for (const recording of recordingsToDelete) {
      try {
        // TODO: 実際のファイルストレージから録画ファイルを削除する処理
        // 例: AWS S3, Google Cloud Storage, Vercel Blob等からの削除

        // データベースから録画レコードを削除
        await prisma.recordingUsage.delete({
          where: { id: recording.id },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete recording ${recording.id}:`, error);
      }
    }

    // 削除統計をログに記録
    console.log(`Cleanup completed: ${deletedCount} recordings deleted`);

    return NextResponse.json({
      success: true,
      deletedCount,
      totalChecked: expiredRecordings.length,
    });
  } catch (error) {
    console.error("Recording cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
