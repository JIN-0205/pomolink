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

    // デバッグ: リクエストボディをログ出力
    const body = await req.json();
    console.log("[POMODORO_SESSION_CREATE] request body:", body);
    const { taskId, visitId } = body;

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

    // visitIdが必須
    if (!visitId) {
      return new NextResponse("visitIdが必要です", { status: 400 });
    }

    // Visitが存在するか確認
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit) {
      return new NextResponse("Visitが見つかりません", { status: 404 });
    }

    // ポモドーロセッション作成
    const session = await prisma.pomoSession.create({
      data: {
        startTime: new Date(),
        completed: false,
        taskId,
        visitId,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("[POMODORO_SESSION_CREATE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// 動画URLをセッションに紐付ける
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("未認証", { status: 401 });
    const sessionId = params.sessionId;
    const { videoUrl, duration } = await req.json();
    // セッション取得
    const session = await prisma.pomoSession.findUnique({
      where: { id: sessionId },
    });
    if (!session)
      return new NextResponse("セッションが見つかりません", { status: 404 });
    // Recording作成
    const recording = await prisma.recording.create({
      data: {
        videoUrl,
        duration: duration ?? 0,
        sessionId,
        taskId: session.taskId,
      },
    });
    return NextResponse.json(recording);
  } catch (error) {
    console.error("[POMODORO_SESSION_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
