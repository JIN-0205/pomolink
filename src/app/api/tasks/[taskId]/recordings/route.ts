// app/api/tasks/[taskId]/recordings/route.ts
import prisma from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * 特定のタスクに関連する録画データを取得するAPI
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // ユーザー認証チェック - authとcurrentUserの両方を使用
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const taskId = await params.taskId;
    console.log(`録画データ取得: タスクID=${taskId}`);

    // Prismaで現在のユーザー情報を取得
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        room: {
          include: {
            participants: true, // すべての参加者を取得
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "タスクが見つかりません" },
        { status: 404 }
      );
    }

    // ユーザーがこのタスクのあるルームに参加しているかチェック - ユーザーIDを直接比較
    const isParticipant = task.room.participants.some(
      (participant) => participant.userId === dbUser.id
    );

    if (!isParticipant) {
      console.log(
        `アクセス拒否: ユーザー ${dbUser.id} はルーム ${task.roomId} の参加者ではありません`
      );
      return NextResponse.json(
        { error: "このタスクへのアクセス権限がありません" },
        { status: 403 }
      );
    }

    // 録画データを取得 - エラー処理を追加
    console.log(`録画データ検索: タスクID=${taskId}`);
    const recordings = await prisma.recording.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" }, // 新しい順に並べる
    });

    console.log(`録画データ取得成功: ${recordings.length}件`);

    // 録画がない場合は空配列を返す（エラーにしない）
    if (recordings.length === 0) {
      return NextResponse.json([]);
    }

    // フロントエンド向けにデータを整形
    const formattedRecordings = recordings.map((recording) => ({
      id: recording.id,
      taskId: recording.taskId,
      sessionId: recording.sessionId,
      videoUrl: recording.videoUrl,
      duration: recording.duration,
      createdAt: recording.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedRecordings);
  } catch (error) {
    console.error("録画データ取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
