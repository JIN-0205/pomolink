import { PLAN_LIMITS } from "@/lib/subscription-limits";
import { PrismaClient } from "@prisma/client";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // Vercel Cronジョブからのリクエストを検証
  const authHeader = request.headers.get("Authorization");
  console.log("Authorization header:", authHeader);
  console.log("Expected:", `Bearer ${process.env.CRON_SECRET}`);

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    let totalDeleted = 0;

    // 各プランの保存期間に基づいて期限切れ録画を削除
    for (const [planType, limits] of Object.entries(PLAN_LIMITS)) {
      let expiredRecordings;

      // フリープランの場合は分単位で計算（テスト用）
      if (planType === "FREE") {
        const freeLimits = limits as typeof PLAN_LIMITS.FREE;
        const retentionMinutes = freeLimits.recordingRetentionMinutes || 10;
        const expirationDate = new Date(today);
        expirationDate.setMinutes(
          expirationDate.getMinutes() - retentionMinutes
        );

        console.log(
          `Processing ${planType} plan with ${retentionMinutes} minutes retention`
        );

        expiredRecordings = await prisma.session.findMany({
          where: {
            recordingUrl: {
              not: null,
            },
            createdAt: {
              lt: expirationDate,
            },
            user: {
              planType: "FREE",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                planType: true,
              },
            },
          },
        });
      } else {
        // その他のプランは日単位で計算
        const retentionDays = limits.recordingRetentionDays;
        const expirationDate = new Date(today);
        expirationDate.setDate(expirationDate.getDate() - retentionDays);

        console.log(
          `Processing ${planType} plan with ${retentionDays} days retention`
        );

        expiredRecordings = await prisma.session.findMany({
          where: {
            recordingUrl: {
              not: null,
            },
            createdAt: {
              lt: expirationDate,
            },
            user: {
              planType: planType as "BASIC" | "PREMIUM",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                planType: true,
              },
            },
          },
        });
      }

      console.log(
        `Found ${expiredRecordings.length} expired recordings for ${planType} plan`
      );

      let deletedCount = 0;
      for (const recording of expiredRecordings) {
        try {
          // Firebase Storageから録画ファイルを削除
          if (recording.recordingUrl) {
            try {
              await deleteFromFirebaseStorage(recording.recordingUrl);
              console.log(`Deleted recording file: ${recording.recordingUrl}`);
            } catch (storageError) {
              console.error(
                `Failed to delete file from storage: ${recording.recordingUrl}`,
                storageError
              );
            }
          }

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

      totalDeleted += deletedCount;
      console.log(`Deleted ${deletedCount} recordings for ${planType} plan`);
    }

    console.log(
      `Cleanup completed: ${totalDeleted} recordings deleted in total`
    );

    return NextResponse.json({
      success: true,
      totalDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Recording cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Firebase Storageから録画ファイルを削除
 */
async function deleteFromFirebaseStorage(recordingUrl: string): Promise<void> {
  try {
    const storage = getStorage();

    // URLからファイルパスを抽出
    // recordingUrlの形式: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.webm?alt=media&token=...
    const url = new URL(recordingUrl);
    const pathParam = url.pathname.split("/o/")[1];
    if (!pathParam) {
      throw new Error("Invalid recording URL format");
    }

    const filePath = decodeURIComponent(pathParam.split("?")[0]);

    // ファイルを削除
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    await file.delete();

    console.log(`Successfully deleted file: ${filePath}`);
  } catch (error) {
    console.error("Firebase Storage deletion failed:", error);
    throw error;
  }
}
