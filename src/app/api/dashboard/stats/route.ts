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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(today.getDate() - daysFromMonday);

    const [
      totalSessions,
      todaySessions,
      activeRooms,
      completedTasks,
      weeklyProgress,
      continuousStreak,
    ] = await Promise.all([
      prisma.session.count({
        where: {
          userId: user.id,
          completed: true,
        },
      }),

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

      prisma.roomParticipant.count({
        where: {
          userId: user.id,
        },
      }),

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

      prisma.session.count({
        where: {
          userId: user.id,
          completed: true,
          startTime: {
            gte: weekStart,
          },
        },
      }),

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
        take: 100,
      }),
    ]);

    let streak = 0;
    if (continuousStreak.length > 0) {
      const sessionDates = new Set(
        continuousStreak.map(
          (session) => session.startTime.toISOString().split("T")[0]
        )
      );

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
