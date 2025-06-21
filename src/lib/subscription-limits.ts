export const PLAN_LIMITS = {
  FREE: {
    maxRooms: 1,
    maxDailyRecordings: 1,
    maxParticipants: 2,
    recordingRetentionDays: 7,
    price: 0,
  },
  BASIC: {
    maxRooms: 4,
    maxDailyRecordings: 6,
    maxParticipants: 4,
    recordingRetentionDays: 30,
    price: 5,
  },
  PREMIUM: {
    maxRooms: 10,
    maxDailyRecordings: 15,
    maxParticipants: 10,
    recordingRetentionDays: 90,
    price: 8,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanName(planType: PlanType): string {
  const names = {
    FREE: "フリー",
    BASIC: "ベーシック",
    PREMIUM: "プレミアム",
  };
  return names[planType];
}

export function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType];
}

export function getRoomPlanLimits(ownerPlanType: PlanType) {
  return PLAN_LIMITS[ownerPlanType];
}

export const PLAN_BENEFITS = {
  FREE: {
    name: "フリープラン",
    price: "無料",
    features: [
      `ルーム作成数: ${PLAN_LIMITS.FREE.maxRooms}個まで`,
      `録画: ${PLAN_LIMITS.FREE.maxDailyRecordings}回/日`,
      `参加者数: ${PLAN_LIMITS.FREE.maxParticipants}人まで`,
      `録画保存期間: ${PLAN_LIMITS.FREE.recordingRetentionDays}日間`,
    ],
  },
  BASIC: {
    name: "ベーシックプラン",
    price: `$${PLAN_LIMITS.BASIC.price}/月`,
    features: [
      `ルーム作成数: ${PLAN_LIMITS.BASIC.maxRooms}個まで`,
      `録画: ${PLAN_LIMITS.BASIC.maxDailyRecordings}回/日`,
      `参加者数: ${PLAN_LIMITS.BASIC.maxParticipants}人まで`,
      `録画保存期間: ${PLAN_LIMITS.BASIC.recordingRetentionDays}日間`,
    ],
  },
  PREMIUM: {
    name: "プレミアムプラン",
    price: `$${PLAN_LIMITS.PREMIUM.price}/月`,
    features: [
      `ルーム作成数: ${PLAN_LIMITS.PREMIUM.maxRooms}個まで`,
      `録画: ${PLAN_LIMITS.PREMIUM.maxDailyRecordings}回/日`,
      `参加者数: ${PLAN_LIMITS.PREMIUM.maxParticipants}人まで`,
      `録画保存期間: ${PLAN_LIMITS.PREMIUM.recordingRetentionDays}日間`,
      "優先サポート",
    ],
  },
} as const;
