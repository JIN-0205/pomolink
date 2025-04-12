import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ポモドーロセッション作成API
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("未認証", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { taskId } = await req.json();

    // タスクが存在するか確認
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          room: {
            include: {
              participants: true,
            },
          },
        },
      });

      if (!task) {
        return new NextResponse("タスクが見つかりません", { status: 404 });
      }

      // ユーザーがルームに参加しているか確認
      const isParticipant = task.room.participants.some(
        (p) => p.userId === user.id
      );

      if (!isParticipant) {
        return new NextResponse("このタスクにアクセスする権限がありません", {
          status: 403,
        });
      }
    }

    // ポモドーロセッション作成
    const session = await prisma.pomoSession.create({
      data: {
        startTime: new Date(),
        completed: false,
        taskId,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("[POMODORO_SESSION_CREATE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
