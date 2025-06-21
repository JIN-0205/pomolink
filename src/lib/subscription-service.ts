import { auth } from "@clerk/nextjs/server";
import { PlanType, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getPlanLimits } from "./subscription-limits";

const prisma = new PrismaClient();

/**
 * ユーザーの現在のプランを取得
 */
export async function getUserSubscription(): Promise<PlanType> {
  const { has } = await auth();
  if (has({ plan: "premium_user" })) {
    return PlanType.PREMIUM;
  }
  if (has({ plan: "basic_user" })) {
    return PlanType.BASIC;
  }
  return PlanType.FREE;
}

/**
 * ルームの作成者のプランを取得
 */
export async function getRoomPlan(roomId: string): Promise<PlanType> {
  const roomCreatorId = await prisma.room.findUnique({
    where: { id: roomId },
  });
  const roomCreatorPlan = await prisma.user.findUnique({
    where: { id: roomCreatorId?.creatorId || "" },
  });
  return roomCreatorPlan?.planType || PlanType.FREE;
}

/**
 * ルーム作成可能かチェック
 */
export async function canCreateRoom(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}> {
  const planType = await getUserSubscription();
  const limits = getPlanLimits(planType);

  const currentCount = await prisma.room.count({
    where: { creatorId: userId },
  });

  return {
    canCreate: currentCount < limits.maxRooms,
    currentCount,
    maxCount: limits.maxRooms,
    planType,
  };
}

/**
 * 日次録画回数を取得
 */
export async function getDailyRecordingCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.recordingUsage.count({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count;
}

/**
 * 録画可能かチェック
 */
export async function canRecord(
  roomId: string,
  userId: string
): Promise<{
  canRecord: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}> {
  const planType = await getRoomPlan(roomId);
  const limits = getPlanLimits(planType);
  const currentCount = await getDailyRecordingCount(userId);

  return {
    canRecord: currentCount < limits.maxDailyRecordings,
    currentCount,
    maxCount: limits.maxDailyRecordings,
    planType,
  };
}

/**
 * 参加者追加可能かチェック
 */
export async function canAddParticipant(
  roomId: string,
  plannerId?: string
): Promise<{
  canAdd: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}> {
  // プランナーIDが指定されている場合はそのプランを使用、そうでなければルームのプランを使用
  let planType: PlanType;
  if (plannerId) {
    planType = await getUserSubscriptionById(plannerId);
  } else {
    planType = await getRoomPlan(roomId);
  }

  const limits = getPlanLimits(planType);

  const currentCount = await prisma.roomParticipant.count({
    where: { roomId },
  });

  return {
    canAdd: currentCount < limits.maxParticipants,
    currentCount,
    maxCount: limits.maxParticipants,
    planType,
  };
}

/**
 * 録画使用量を記録
 */
export async function recordRecordingUsage(
  userId: string,
  sessionId?: string,
  fileSize?: number,
  duration?: number
) {
  return await prisma.recordingUsage.create({
    data: {
      userId,
      sessionId,
      fileSize,
      duration,
    },
  });
}

/**
 * 統一的な制限チェッカー
 */
export async function checkSubscriptionLimits(userId: string, roomId?: string) {
  const userPlan = await getUserSubscription();
  const roomPlan = roomId ? await getRoomPlan(roomId) : userPlan;

  return {
    userPlan,
    roomPlan,
    canCreateRoom: await canCreateRoom(userId),
    canRecord: roomId ? await canRecord(roomId, userId) : null,
    canAddParticipant: roomId ? await canAddParticipant(roomId) : null,
  };
}

/**
 * 指定されたユーザーIDのサブスクリプションプランを取得
 */
export async function getUserSubscriptionById(
  userId: string
): Promise<PlanType> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        planType: true,
      },
    });

    if (!user) {
      console.warn(`User not found: ${userId}`);
      return PlanType.FREE;
    }

    return user.planType || PlanType.FREE;
  } catch (error) {
    console.error("Error getting user subscription by ID:", error);
    return PlanType.FREE;
  }
}

// ミドルウェア関数群

/**
 * ミドルウェア関数: 録画制限チェック
 */
export async function withRecordingLimitCheck(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  roomId: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recordingCheck = await canRecord(roomId, user.id);

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

/**
 * ミドルウェア関数: ルーム作成制限チェック
 */
export async function withRoomCreationLimitCheck(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roomCreationCheck = await canCreateRoom(user.id);

    if (!roomCreationCheck.canCreate) {
      return NextResponse.json(
        {
          error: "ルーム作成数の上限に達しました",
          code: "ROOM_CREATION_LIMIT_EXCEEDED",
          currentCount: roomCreationCheck.currentCount,
          maxCount: roomCreationCheck.maxCount,
          planType: roomCreationCheck.planType,
          needsUpgrade: true,
        },
        { status: 403 }
      );
    }

    return handler(request);
  } catch (error) {
    console.error("Room creation limit check failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * ミドルウェア関数: 参加者制限チェック
 */
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

    const participantCheck = await canAddParticipant(roomId);

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
