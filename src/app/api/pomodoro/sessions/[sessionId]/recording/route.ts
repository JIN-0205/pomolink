import prisma from "@/lib/db";
import {
  getRecordingDaysUntilExpiration,
  getRecordingMinutesUntilExpiration,
  getRecordingUrl,
} from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return new NextResponse("未認証", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        task: {
          include: {
            room: {
              include: {
                participants: {
                  where: {
                    userId: user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return new NextResponse("セッションが見つかりません", { status: 404 });
    }

    const hasAccess =
      session.userId === user.id || session.task.room.participants.length > 0;

    if (!hasAccess) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    const recordingUrl = await getRecordingUrl(sessionId);

    const daysUntilExpiration =
      await getRecordingDaysUntilExpiration(sessionId);

    const minutesUntilExpiration =
      await getRecordingMinutesUntilExpiration(sessionId);

    return NextResponse.json({
      recordingUrl,
      daysUntilExpiration,
      minutesUntilExpiration,
      isExpired: recordingUrl === null && session.recordingUrl !== null,
    });
  } catch (error) {
    console.error("[GET_RECORDING_URL_ERROR]", error);
    return new NextResponse("内部サーバーエラー", { status: 500 });
  }
}
