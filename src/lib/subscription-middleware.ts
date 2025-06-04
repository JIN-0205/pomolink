import prisma from "@/lib/db";
import { canAddParticipant, canRecord } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function withRecordingLimitCheck(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk IDからユーザーIDを取得
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recordingCheck = await canRecord(user.id);

    if (!recordingCheck.canRecord) {
      return NextResponse.json(
        {
          error: "録画制限に達しました",
          code: "RECORDING_LIMIT_EXCEEDED",
          currentCount: recordingCheck.currentCount,
          maxCount: recordingCheck.maxCount,
          planType: recordingCheck.planType,
        },
        { status: 403 }
      );
    }

    return handler(request);
  } catch (error) {
    console.error("Recording limit check failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function withParticipantLimitCheck(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  roomId: string
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ルーム情報を取得してプランナーIDを特定
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const plannerId = room.mainPlannerId || room.creatorId;
    const participantCheck = await canAddParticipant(roomId, plannerId);

    if (!participantCheck.canAdd) {
      return NextResponse.json(
        {
          error: "参加者制限に達しました",
          code: "PARTICIPANT_LIMIT_EXCEEDED",
          currentCount: participantCheck.currentCount,
          maxCount: participantCheck.maxCount,
          planType: participantCheck.planType,
        },
        { status: 403 }
      );
    }

    return handler(request);
  } catch (error) {
    console.error("Participant limit check failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
