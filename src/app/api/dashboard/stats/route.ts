import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    // 今日の開始時刻と終了時刻を計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 今週の開始時刻を計算（月曜日から）
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 日曜日は6、月曜日は0
    weekStart.setDate(today.getDate() - daysFromMonday);

    // 統計データを並行して取得
    const [
      totalSessions,
      todaySessions,
      activeRooms,
      completedTasks,
      weeklyProgress,
      continuousStreak,
    ] = await Promise.all([
      // 総ポモドーロ数（完了したセッション）
      prisma.session.count({
        where: {
          userId: user.id,
          completed: true,
        },
      }),

      // 今日のポモドーロ数
      prisma.session.count({
        where: {
          userId: user.id,
          completed: true,
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // 参加中のアクティブルーム数
      prisma.roomParticipant.count({
        where: {
          userId: user.id,
        },
      }),

      // 今月の完了タスク数
      prisma.task.count({
        where: {
          room: {
            participants: {
              some: {
                userId: user.id,
              },
            },
          },
          status: "COMPLETED",
          updatedAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      }),

      // 今週の進捗（目標を週30ポモドーロと仮定）
      prisma.session.count({
        where: {
          userId: user.id,
          completed: true,
          startTime: {
            gte: weekStart,
          },
        },
      }),

      // 連続日数を計算するため、最近のセッション履歴を取得
      prisma.session.findMany({
        where: {
          userId: user.id,
          completed: true,
        },
        select: {
          startTime: true,
        },
        orderBy: {
          startTime: "desc",
        },
        take: 100, // 最近100件を取得して連続日数を計算
      }),
    ]);

    // 連続日数の計算
    let streak = 0;
    if (continuousStreak.length > 0) {
      const sessionDates = new Set(
        continuousStreak.map(
          (session) => session.startTime.toISOString().split("T")[0]
        )
      );

      // 今日または昨日から遡って連続日数をカウント
      // 今日セッションがなくても昨日があれば連続とみなす
      // eslint-disable-next-line prefer-const
      let checkDate = new Date(today);
      if (!sessionDates.has(checkDate.toISOString().split("T")[0])) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (sessionDates.has(checkDate.toISOString().split("T")[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 週間進捗率を計算（目標30ポモドーロに対する割合）
    const weeklyProgressPercentage = Math.min(
      Math.round((weeklyProgress / 30) * 100),
      100
    );

    const stats = {
      totalPomodoros: totalSessions,
      completedTasks,
      activeRooms,
      weeklyProgress: weeklyProgressPercentage,
      todayPomodoros: todaySessions,
      streak,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
