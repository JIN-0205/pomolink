import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ポモドーロセッション完了API
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
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

    const sessionId = params.sessionId;

    // セッションが存在するか確認
    const session = await prisma.pomoSession.findUnique({
      where: { id: sessionId },
      include: {
        task: {
          include: {
            room: {
              include: {
                participants: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return new NextResponse("セッションが見つかりません", { status: 404 });
    }

    // ユーザーがルームに参加しているか確認
    const isParticipant = session.task.room.participants.some(
      (p) => p.userId === user.id
    );

    if (!isParticipant) {
      return new NextResponse("このセッションを更新する権限がありません", {
        status: 403,
      });
    }

    // 既に完了している場合
    if (session.completed) {
      return new NextResponse("このセッションは既に完了しています", {
        status: 400,
      });
    }

    // セッションを完了としてマーク
    const updatedSession = await prisma.pomoSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        completed: true,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("[POMODORO_SESSION_COMPLETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
