import { auth } from "@clerk/nextjs/server";
import { PlanType, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getDefaultPlanForUser, getFeatureFlags } from "./subscription-flag";
import { getPlanLimits, PLAN_LIMITS } from "./subscription-limits";

const prisma = new PrismaClient();

export async function getUserSubscription(): Promise<PlanType> {
  if (getFeatureFlags().TEST_MODE) {
    return getDefaultPlanForUser();
  }
  const { has } = await auth();
  if (has({ plan: "premium_user" })) {
    return PlanType.PREMIUM;
  }
  if (has({ plan: "basic_user" })) {
    return PlanType.BASIC;
  }
  return PlanType.FREE;
}

export async function getRoomPlan(roomId: string): Promise<PlanType> {
  console.log("=== ルームプラン取得 ===");
  console.log("Room ID:", roomId);

  if (getFeatureFlags().TEST_MODE) {
    console.log(
      "Test mode enabled, using default plan:",
      getFeatureFlags().DEFAULT_TEST_PLAN
    );
    return getDefaultPlanForUser();
  }

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

export async function getDailyRecordingCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log("=== ユーザー日次録画回数取得 ===");
  console.log("User ID:", userId);
  console.log("Today:", today.toISOString());
  console.log("Tomorrow:", tomorrow.toISOString());

  const count = await prisma.session.count({
    where: {
      userId,
      recordingUrl: {
        not: null,
      },
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  console.log("ユーザー録画回数:", count);
  return count;
}

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

  const count = await prisma.session.count({
    where: {
      task: {
        roomId: roomId,
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

  console.log("ルーム録画回数:", count);
  return count;
}

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
  roomOwnerName?: string;
}> {
  const planType = await getRoomPlan(roomId);
  const limits = getPlanLimits(planType);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { creator: true },
  });

  const roomOwnerName = room?.creator.name || "ルームオーナー";

  const roomDailyCount = await getRoomDailyRecordingCount(roomId);
  const userDailyCount = await getDailyRecordingCount(userId);

  console.log("=== 制限チェック詳細 ===");
  console.log("プランタイプ:", planType);
  console.log("最大録画回数:", limits.maxDailyRecordings);
  console.log("現在のルーム録画回数:", roomDailyCount);
  console.log("現在のユーザー録画回数:", userDailyCount);

  if (roomDailyCount >= limits.maxDailyRecordings) {
    console.log("ルーム制限に達しています");
    return {
      canRecord: false,
      currentCount: roomDailyCount,
      maxCount: limits.maxDailyRecordings,
      planType,
      limitType: "ROOM",
      reason: "ルーム全体の日次録画制限に達しました",
      roomOwnerName,
    };
  }

  if (userDailyCount >= limits.maxDailyRecordings) {
    console.log("ユーザー制限に達しています");
    return {
      canRecord: false,
      currentCount: userDailyCount,
      maxCount: limits.maxDailyRecordings,
      planType,
      limitType: "USER",
      reason: "ユーザー個人の日次録画制限に達しました",
      roomOwnerName,
    };
  }

  console.log("録画可能です");
  return {
    canRecord: true,
    currentCount: Math.max(roomDailyCount, userDailyCount),
    maxCount: limits.maxDailyRecordings,
    planType,
    limitType: "ROOM",
    roomOwnerName,
  };
}

export async function canAddParticipant(
  roomId: string,
  plannerId?: string
): Promise<{
  canAdd: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}> {
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

export async function checkSubscriptionLimits(userId: string, roomId?: string) {
  const userPlan = await getUserSubscription();
  const roomPlan = roomId ? await getRoomPlan(roomId) : userPlan;

  return {
    userPlan,
    roomPlan,
    canCreateRoom: await canCreateRoom(userId),
    canRecord: roomId ? await canRecord(roomId, userId) : null,
    canUpload: roomId ? await canUpload(roomId, userId) : null,
    canAddParticipant: roomId ? await canAddParticipant(roomId) : null,
  };
}

export async function getUserSubscriptionById(
  userId: string
): Promise<PlanType> {
  if (getFeatureFlags().TEST_MODE) {
    return getDefaultPlanForUser();
  }

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

export async function canUpload(
  roomId: string,
  userId: string,
  uploadCount: number = 1
): Promise<{
  canUpload: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
  limitType: "USER" | "ROOM";
  reason?: string;
}> {
  const planType = await getRoomPlan(roomId);
  const limits = getPlanLimits(planType);

  const roomDailyCount = await getRoomDailyUploadCount(roomId);
  const userDailyCount = await getDailyUploadCount(userId);

  console.log("=== アップロード制限チェック詳細 ===");
  console.log("プランタイプ:", planType);
  console.log("最大アップロード回数:", limits.maxDailyUploads);
  console.log("現在のルームアップロード回数:", roomDailyCount);
  console.log("現在のユーザーアップロード回数:", userDailyCount);
  console.log("アップロード予定数:", uploadCount);

  if (roomDailyCount + uploadCount > limits.maxDailyUploads) {
    console.log("ルーム制限に達しています");
    return {
      canUpload: false,
      currentCount: roomDailyCount,
      maxCount: limits.maxDailyUploads,
      planType,
      limitType: "ROOM",
      reason: "ルーム全体の日次アップロード制限に達しました",
    };
  }

  if (userDailyCount + uploadCount > limits.maxDailyUploads) {
    console.log("ユーザー制限に達しています");
    return {
      canUpload: false,
      currentCount: userDailyCount,
      maxCount: limits.maxDailyUploads,
      planType,
      limitType: "USER",
      reason: "ユーザー個人の日次アップロード制限に達しました",
    };
  }

  console.log("アップロード可能です");
  return {
    canUpload: true,
    currentCount: Math.max(roomDailyCount, userDailyCount),
    maxCount: limits.maxDailyUploads,
    planType,
    limitType: "ROOM",
  };
}

async function getRoomDailyUploadCount(roomId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.upload.count({
    where: {
      task: {
        roomId: roomId,
      },
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count;
}

async function getDailyUploadCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.upload.count({
    where: {
      userId: userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count;
}

export async function isRecordingExpired(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          planType: true,
        },
      },
    },
  });

  if (!session || !session.recordingUrl) {
    return true;
  }

  const userPlan = session.user.planType;
  const limits = getPlanLimits(userPlan);

  if (userPlan === "FREE") {
    const freeLimits = limits as typeof PLAN_LIMITS.FREE;
    const retentionMinutes = freeLimits.recordingRetentionMinutes || 10;
    const expirationDate = new Date(session.createdAt);
    expirationDate.setMinutes(expirationDate.getMinutes() + retentionMinutes);
    return new Date() > expirationDate;
  }

  const retentionDays = limits.recordingRetentionDays;
  const expirationDate = new Date(session.createdAt);
  expirationDate.setDate(expirationDate.getDate() + retentionDays);

  return new Date() > expirationDate;
}

export async function getRecordingUrl(
  sessionId: string
): Promise<string | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          planType: true,
        },
      },
    },
  });

  if (!session || !session.recordingUrl) {
    return null;
  }

  if (await isRecordingExpired(sessionId)) {
    return null;
  }

  return session.recordingUrl;
}

export async function getRecordingDaysUntilExpiration(
  sessionId: string
): Promise<number | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          planType: true,
        },
      },
    },
  });

  if (!session || !session.recordingUrl) {
    return null;
  }

  const userPlan = session.user.planType;
  const limits = getPlanLimits(userPlan);

  if (userPlan === "FREE") {
    const freeLimits = limits as typeof PLAN_LIMITS.FREE;
    const retentionMinutes = freeLimits.recordingRetentionMinutes || 10;
    const expirationDate = new Date(session.createdAt);
    expirationDate.setMinutes(expirationDate.getMinutes() + retentionMinutes);

    const today = new Date();
    const timeDiff = expirationDate.getTime() - today.getTime();
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));

    return minutesDiff > 0 ? Math.max(0.1, minutesDiff / (24 * 60)) : 0;
  }

  const retentionDays = limits.recordingRetentionDays;
  const expirationDate = new Date(session.createdAt);
  expirationDate.setDate(expirationDate.getDate() + retentionDays);

  const today = new Date();
  const timeDiff = expirationDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return daysDiff;
}

export async function getRecordingMinutesUntilExpiration(
  sessionId: string
): Promise<number | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          planType: true,
        },
      },
    },
  });

  if (!session || !session.recordingUrl) {
    return null;
  }

  const userPlan = session.user.planType;

  if (userPlan === "FREE") {
    const limits = getPlanLimits(userPlan);
    const freeLimits = limits as typeof PLAN_LIMITS.FREE;
    const retentionMinutes = freeLimits.recordingRetentionMinutes || 10;
    const expirationDate = new Date(session.createdAt);
    expirationDate.setMinutes(expirationDate.getMinutes() + retentionMinutes);

    const today = new Date();
    const timeDiff = expirationDate.getTime() - today.getTime();
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));

    return minutesDiff;
  }

  return null;
}

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
