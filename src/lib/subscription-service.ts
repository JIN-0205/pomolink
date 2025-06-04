import { PlanType, PrismaClient } from "@prisma/client";
import { getPlanLimits } from "./subscription-limits";

const prisma = new PrismaClient();

/**
 * ユーザーの現在のプランを取得
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return subscription?.planType || "FREE";
}

/**
 * ユーザーのサブスクリプション情報を取得
 */
export async function getUserSubscription(userId: string) {
  return await prisma.subscription.findUnique({
    where: { userId },
  });
}

/**
 * 今日の録画数をチェック
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
 * 録画制限をチェック
 */
export async function canRecord(userId: string): Promise<{
  canRecord: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}> {
  const planType = await getUserPlan(userId);
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
 * ルーム参加者数制限をチェック
 */
export async function canAddParticipant(
  roomId: string,
  plannerId: string
): Promise<{
  canAdd: boolean;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
}> {
  const planType = await getUserPlan(plannerId);
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
 * 古い録画を削除（保存期間を過ぎたもの）
 */
export async function cleanupExpiredRecordings() {
  const subscriptions = await prisma.subscription.findMany({
    include: { user: true },
  });

  for (const subscription of subscriptions) {
    const limits = getPlanLimits(subscription.planType);
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() - limits.recordingRetentionDays
    );

    // 期限切れの録画使用量レコードを取得
    const expiredRecordings = await prisma.recordingUsage.findMany({
      where: {
        userId: subscription.userId,
        date: {
          lt: expirationDate,
        },
      },
      include: {
        session: true,
      },
    });

    // 関連するセッションの録画URLを削除
    for (const recording of expiredRecordings) {
      if (recording.session?.recordingUrl) {
        // TODO: Firebase Storageからファイルを削除
        await prisma.session.update({
          where: { id: recording.sessionId || "" },
          data: { recordingUrl: null, recordingDuration: null },
        });
      }
    }

    // 録画使用量レコードを削除
    await prisma.recordingUsage.deleteMany({
      where: {
        userId: subscription.userId,
        date: {
          lt: expirationDate,
        },
      },
    });
  }
}

/**
 * プランのアップグレード/ダウングレード
 */
export async function updateUserPlan(
  userId: string,
  newPlanType: PlanType,
  stripeData?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
  }
) {
  const limits = getPlanLimits(newPlanType);

  return await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planType: newPlanType,
      maxDailyRecordings: limits.maxDailyRecordings,
      maxParticipants: limits.maxParticipants,
      recordingRetentionDays: limits.recordingRetentionDays,
      ...stripeData,
    },
    update: {
      planType: newPlanType,
      maxDailyRecordings: limits.maxDailyRecordings,
      maxParticipants: limits.maxParticipants,
      recordingRetentionDays: limits.recordingRetentionDays,
      ...stripeData,
    },
  });
}
