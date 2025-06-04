import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 今日の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 今日の録画使用量を取得
    const dailyUsage = await prisma.recordingUsage.count({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // ユーザーのサブスクリプション情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      return NextResponse.json(
        { error: "User or subscription not found" },
        { status: 404 }
      );
    }

    // 現在参加中のルーム数を取得
    const activeRooms = await prisma.roomParticipant.count({
      where: {
        userId,
        // 必要に応じて、アクティブなルームのみをカウントする条件を追加
      },
    });

    return NextResponse.json({
      planType: user.subscription.planType,
      dailyRecordingCount: dailyUsage,
      maxDailyRecordings: user.subscription.maxDailyRecordings,
      maxParticipants: user.subscription.maxParticipants,
      recordingRetentionDays: user.subscription.recordingRetentionDays,
      activeRooms,
    });
  } catch (error) {
    console.error("Failed to fetch subscription usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
