import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH: セッションの録画情報・完了状態を更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });
    const { sessionId } = await params;
    const { recordingUrl, recordingDuration, endTime, completed } =
      await req.json();
    // セッション取得
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SESSION_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
