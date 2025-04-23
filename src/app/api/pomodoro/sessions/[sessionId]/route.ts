import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// 動画URLをセッションに紐付ける
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = params.sessionId;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("未認証", { status: 401 });

    const { videoUrl, duration } = await req.json();
    const session = await prisma.pomoSession.findUnique({
      where: { id: sessionId },
    });
    if (!session)
      return new NextResponse("セッションが見つかりません", { status: 404 });

    // Recording作成 or 更新
    const recording = await prisma.recording.upsert({
      where: { sessionId },
      create: {
        videoUrl,
        duration: duration ?? 0,
        sessionId,
        taskId: session.taskId,
      },
      update: { videoUrl, duration: duration ?? 0 },
    });

    return NextResponse.json(recording);
  } catch (error) {
    console.error("[POMODORO_SESSION_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
