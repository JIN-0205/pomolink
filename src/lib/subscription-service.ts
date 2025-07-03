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
  console.log("=== ルームプラン取得 ===");
  console.log("Room ID:", roomId);

  const roomCreatorId = await prisma.room.findUnique({
    where: { id: roomId },
  });

  console.log("Room Creator ID:", roomCreatorId?.creatorId);

  const roomCreatorPlan = await prisma.user.findUnique({
    where: { id: roomCreatorId?.creatorId || "" },
  });

  const planType = roomCreatorPlan?.planType || PlanType.FREE;
  console.log("Room Plan:", planType);

  return planType;
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
 * 日次録画回数を取得（ユーザー個人）
 */
export async function getDailyRecordingCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log("=== ユーザー日次録画回数取得 ===");
  console.log("User ID:", userId);
  console.log("Today:", today.toISOString());
  console.log("Tomorrow:", tomorrow.toISOString());

  const count = await prisma.recordingUsage.count({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  console.log("ユーザー録画回数:", count);
  return count;
}

/**
 * ルーム全体の日次録画回数を取得
 */
export async function getRoomDailyRecordingCount(
  roomId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log("=== ルーム日次録画回数取得 ===");
  console.log("Room ID:", roomId);
  console.log("Today:", today.toISOString());
  console.log("Tomorrow:", tomorrow.toISOString());

  // ルームに関連するセッションの録画使用量を集計
  const count = await prisma.recordingUsage.count({
    where: {
      session: {
        task: {
          roomId: roomId,
        },
      },
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  console.log("ルーム録画回数:", count);
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
  limitType: "USER" | "ROOM";
  reason?: string;
}> {
  const planType = await getRoomPlan(roomId);
  const limits = getPlanLimits(planType);

  // ルーム全体の録画制限をチェック
  const roomDailyCount = await getRoomDailyRecordingCount(roomId);
  const userDailyCount = await getDailyRecordingCount(userId);

  console.log("=== 制限チェック詳細 ===");
  console.log("プランタイプ:", planType);
  console.log("最大録画回数:", limits.maxDailyRecordings);
  console.log("現在のルーム録画回数:", roomDailyCount);
  console.log("現在のユーザー録画回数:", userDailyCount);

  // ルーム制限をチェック（現在のアップロードを含めると制限を超えるか）
  if (roomDailyCount >= limits.maxDailyRecordings) {
    console.log("ルーム制限に達しています");
    return {
      canRecord: false,
      currentCount: roomDailyCount,
      maxCount: limits.maxDailyRecordings,
      planType,
      limitType: "ROOM",
      reason: "ルーム全体の日次録画制限に達しました",
    };
  }

  // ユーザー個人の制限もチェック（現在のアップロードを含めると制限を超えるか）
  if (userDailyCount >= limits.maxDailyRecordings) {
    console.log("ユーザー制限に達しています");
    return {
      canRecord: false,
      currentCount: userDailyCount,
      maxCount: limits.maxDailyRecordings,
      planType,
      limitType: "USER",
      reason: "ユーザー個人の日次録画制限に達しました",
    };
  }

  console.log("録画可能です");
  return {
    canRecord: true,
    currentCount: Math.max(roomDailyCount, userDailyCount),
    maxCount: limits.maxDailyRecordings,
    planType,
    limitType: "ROOM",
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
  console.log("=== 録画使用量記録開始 ===");
  console.log("User ID:", userId);
  console.log("Session ID:", sessionId);
  console.log("File Size:", fileSize);
  console.log("Duration:", duration);

  // 今日の日付（時刻なし）を明示的に設定
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("Recording date:", today.toISOString());

  const usage = await prisma.recordingUsage.create({
    data: {
      userId,
      sessionId,
      fileSize,
      duration,
      date: today, // 明示的に今日の日付を設定
    },
  });

  console.log("録画使用量記録完了:", usage);
  console.log("=== 録画使用量記録終了 ===");

  return usage;
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
      const errorMessage = recordingCheck.reason || "録画制限に達しました";
      return NextResponse.json(
        {
          error: errorMessage,
          code: "RECORDING_LIMIT_EXCEEDED",
          currentCount: recordingCheck.currentCount,
          maxCount: recordingCheck.maxCount,
          planType: recordingCheck.planType,
          limitType: recordingCheck.limitType,
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
