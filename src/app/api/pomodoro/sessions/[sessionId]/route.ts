import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH: セッションの録画情報・完了状態を更新
export async function PATCH(
  req: NextRequest,
  context: { params: { sessionId: string } }
) {
  const { sessionId } = context.params;
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    const { recordingUrl, recordingDuration, endTime, completed } =
      await req.json();
    // セッション取得
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { task: { select: { roomId: true } } },
    });
    if (!session)
      return new NextResponse("セッションが見つかりません", { status: 404 });
    // 権限チェック
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user || session.userId !== user.id) {
      return new NextResponse("権限がありません", { status: 403 });
    }
    // セッション更新
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingUrl: recordingUrl ?? session.recordingUrl,
        recordingDuration: recordingDuration ?? session.recordingDuration,
        endTime: endTime ? new Date(endTime) : session.endTime,
        completed:
          typeof completed === "boolean" ? completed : session.completed,
      },
    });
    // 完了状態になった場合にポイント履歴を追加
    if (!session.completed && updated.completed) {
      try {
        // デフォルト1ポイントを付与
        await prisma.pointHistory.create({
          data: {
            userId: session.userId,
            roomId: session.task.roomId,
            type: "SESSION_BONUS",
            points: 1,
            reason: "Pomodoro完了ボーナス",
            relatedTaskId: session.taskId,
          },
        });
      } catch (bonusError) {
        console.error(
          "[SESSION_PATCH_BONUS] ボーナスポイント作成エラー",
          bonusError
        );
        // ポイント履歴作成エラーは全体の更新失敗としない
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SESSION_PATCH]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
