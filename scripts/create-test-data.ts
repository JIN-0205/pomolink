import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log("テストデータを作成中...");

    // 現在の時刻を取得
    const now = new Date();

    // フリープランユーザーの期限切れ録画（15分前）
    const freeExpiredSession = await prisma.session.create({
      data: {
        userId: "test-user-free", // 実際のユーザーIDに置き換え
        taskId: "test-task-1", // 実際のタスクIDに置き換え
        startTime: new Date(now.getTime() - 15 * 60 * 1000), // 15分前
        endTime: new Date(now.getTime() - 14 * 60 * 1000), // 14分前
        completed: true,
        recordingUrl:
          "https://firebasestorage.googleapis.com/v0/b/test/o/test-expired-free.mp4",
        recordingDuration: 60,
        createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15分前
      },
    });

    // フリープランユーザーの有効な録画（5分前）
    const freeValidSession = await prisma.session.create({
      data: {
        userId: "test-user-free",
        taskId: "test-task-2",
        startTime: new Date(now.getTime() - 5 * 60 * 1000), // 5分前
        endTime: new Date(now.getTime() - 4 * 60 * 1000), // 4分前
        completed: true,
        recordingUrl:
          "https://firebasestorage.googleapis.com/v0/b/test/o/test-valid-free.mp4",
        recordingDuration: 60,
        createdAt: new Date(now.getTime() - 5 * 60 * 1000), // 5分前
      },
    });

    // ベーシックプランユーザーの期限切れ録画（35日前）
    const basicExpiredSession = await prisma.session.create({
      data: {
        userId: "test-user-basic",
        taskId: "test-task-3",
        startTime: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // 35日前
        endTime: new Date(
          now.getTime() - 35 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ), // 35日前 + 1時間
        completed: true,
        recordingUrl:
          "https://firebasestorage.googleapis.com/v0/b/test/o/test-expired-basic.mp4",
        recordingDuration: 3600,
        createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // 35日前
      },
    });

    console.log("テストデータの作成が完了しました:");
    console.log(`- フリープラン期限切れ: ${freeExpiredSession.id}`);
    console.log(`- フリープラン有効: ${freeValidSession.id}`);
    console.log(`- ベーシック期限切れ: ${basicExpiredSession.id}`);
  } catch (error) {
    console.error("テストデータの作成に失敗:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
