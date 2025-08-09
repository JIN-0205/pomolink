import prisma from "@/lib/db";
import { getPlanLimits } from "@/lib/subscription-limits";
import { getRoomPlan } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * simple recording check API
 * - Checks if the user can record based on their plan limits
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return new NextResponse("sessionIdが必要です", { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        task: {
          include: {
            room: {
              include: {
                creator: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return new NextResponse("セッションが見つかりません", { status: 404 });
    }

    if (session.recordingUrl) {
      return new NextResponse("このセッションは既に録画済みです", {
        status: 400,
      });
    }

    const planType = await getRoomPlan(session.task.roomId);
    const planLimits = getPlanLimits(planType);
    const maxRecordings = planLimits.maxDailyRecordings;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecordingCount = await prisma.session.count({
      where: {
        task: {
          roomId: session.task.roomId,
        },
        recordingUrl: {
          not: null,
        },
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    console.log("=== 録画制限チェック ===");
    console.log("ルーム:", session.task.room.name);
    console.log("プランタイプ:", planType);
    console.log("制限数:", maxRecordings);
    console.log("今日の録画数:", todayRecordingCount);

    if (todayRecordingCount >= maxRecordings) {
      return NextResponse.json(
        {
          error: `このルームの日次録画制限（${maxRecordings}回）に達しました`,
          code: "RECORDING_LIMIT_EXCEEDED",
          currentCount: todayRecordingCount,
          maxCount: maxRecordings,
          planType: planType,
          roomName: session.task.room.name,
          roomOwnerName: session.task.room.creator.name,
        },
        { status: 403 }
      );
    }

    console.log("制限チェック OK - 録画保存可能");

    return NextResponse.json({
      message: "録画制限チェック成功",
      canRecord: true,
      currentCount: todayRecordingCount,
      maxCount: maxRecordings,
      planType: planType,
    });
  } catch (error) {
    console.error("[RECORDING_CHECK_POST]", error);
    return new NextResponse("録画制限チェック失敗", { status: 500 });
  }
}
