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
    // 30日より古い録画を特定
    const expiredRecordings = await prisma.session.findMany({
      where: {
        recordingUrl: {
          not: null,
        },
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日前より古い
        },
      },
      include: {
        user: true,
      },
    });

    // 録画ファイルの削除とデータベースからの削除
    let deletedCount = 0;
    for (const recording of expiredRecordings) {
      try {
        // TODO: 実際のファイルストレージから録画ファイルを削除する処理
        // 例: Firebase Storage、AWS S3、Google Cloud Storage等からの削除

        // データベースから録画URLを削除（セッション自体は保持）
        await prisma.session.update({
          where: { id: recording.id },
          data: {
            recordingUrl: null,
            recordingDuration: null,
          },
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
