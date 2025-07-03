import prisma from "@/lib/db";
import {
  getDailyRecordingCount,
  getRoomDailyRecordingCount,
  getRoomPlan,
} from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const userIdParam = searchParams.get("userId");

    if (!roomId || !userIdParam) {
      return NextResponse.json(
        { error: "roomId and userId are required" },
        { status: 400 }
      );
    }

    // 今日の日付
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // デバッグ情報を収集
    const roomPlan = await getRoomPlan(roomId);
    const roomDailyCount = await getRoomDailyRecordingCount(roomId);
    const userDailyCount = await getDailyRecordingCount(userIdParam);

    // RecordingUsageテーブルの全レコードを取得（今日分）
    const todaysRecordings = await prisma.recordingUsage.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        session: {
          select: {
            id: true,
            task: {
              select: {
                id: true,
                title: true,
                roomId: true,
              },
            },
          },
        },
      },
    });

    // ルーム関連の録画を手動で検索
    const roomRecordings = todaysRecordings.filter(
      (recording) => recording.session?.task.roomId === roomId
    );

    // ユーザー関連の録画を手動で検索
    const userRecordings = todaysRecordings.filter(
      (recording) => recording.userId === userIdParam
    );

    return NextResponse.json({
      roomId,
      userId: userIdParam,
      roomPlan,
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      counts: {
        roomDailyCount,
        userDailyCount,
        manualRoomCount: roomRecordings.length,
        manualUserCount: userRecordings.length,
      },
      recordings: {
        all: todaysRecordings,
        room: roomRecordings,
        user: userRecordings,
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
