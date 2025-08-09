import prisma from "@/lib/db";
import { canUpload } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { room: { include: { participants: true } } },
    });

    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }

    const isParticipant = task.room.participants.some(
      (p) => p.userId === user.id
    );

    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    const uploadCheck = await canUpload(task.roomId, user.id, 1);

    return NextResponse.json({
      canUpload: uploadCheck.canUpload,
      currentCount: uploadCheck.currentCount,
      maxCount: uploadCheck.maxCount,
      remainingCount: uploadCheck.maxCount - uploadCheck.currentCount,
      planType: uploadCheck.planType,
      limitType: uploadCheck.limitType,
    });
  } catch (error) {
    console.error("[UPLOAD_STATS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
