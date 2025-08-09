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

    const [recentSessions, recentTasks, recentParticipations] =
      await Promise.all([
        prisma.session.findMany({
          where: {
            userId: user.id,
            completed: true,
          },
          include: {
            task: {
              include: {
                room: true,
              },
            },
          },
          orderBy: {
            endTime: "desc",
          },
          take: 5,
        }),

        prisma.task.findMany({
          where: {
            room: {
              participants: {
                some: {
                  userId: user.id,
                },
              },
            },
            status: "COMPLETED",
          },
          include: {
            room: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 5,
        }),

        prisma.roomParticipant.findMany({
          where: {
            userId: user.id,
          },
          include: {
            room: true,
          },
          orderBy: {
            joinedAt: "desc",
          },
          take: 3,
        }),
      ]);
    interface Activity {
      type: string;
      action: string;
      room: string;
      time: Date;
    }

    const activities: Activity[] = [];

    recentSessions.forEach((session) => {
      if (session.endTime) {
        activities.push({
          type: "pomodoro_completed",
          action: "ポモドーロ完了",
          room: session.task.room.name,
          time: session.endTime,
        });
      }
    });

    recentTasks.forEach((task) => {
      activities.push({
        type: "task_completed",
        action: "タスク完了",
        room: task.room.name,
        time: task.updatedAt,
      });
    });

    recentParticipations.forEach((participation) => {
      activities.push({
        type: "room_joined",
        action: "新しいルームに参加",
        room: participation.room.name,
        time: participation.joinedAt,
      });
    });

    activities.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    const recentActivities = activities.slice(0, 10);

    const now = new Date();
    const activitiesWithRelativeTime = recentActivities.map((activity) => {
      const activityTime = new Date(activity.time);
      const diffMs = now.getTime() - activityTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let relativeTime;
      if (diffDays > 0) {
        relativeTime = `${diffDays}日前`;
      } else if (diffHours > 0) {
        relativeTime = `${diffHours}時間前`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        relativeTime = diffMinutes > 0 ? `${diffMinutes}分前` : "たった今";
      }

      return {
        action: activity.action,
        room: activity.room,
        time: relativeTime,
      };
    });

    return NextResponse.json({ activities: activitiesWithRelativeTime });
  } catch (error) {
    console.error("[DASHBOARD_ACTIVITIES_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
