export const PLAN_LIMITS = {
  FREE: {
    maxRooms: 1,
    maxDailyRecordings: 1,
    maxDailyUploads: 1,
    maxParticipants: 2,
    recordingRetentionDays: 0, // テスト用: 10分保存
    recordingRetentionMinutes: 10, // 10分保存
    price: 0,
  },
  BASIC: {
    maxRooms: 4,
    maxDailyRecordings: 6,
    maxDailyUploads: 3,
    maxParticipants: 4,
    recordingRetentionDays: 7,
    price: 5,
  },
  PREMIUM: {
    maxRooms: 10,
    maxDailyRecordings: 15,
    maxDailyUploads: 10,
    maxParticipants: 10,
    recordingRetentionDays: 90,
    price: 8,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanName(planType: PlanType): string {
  const names = {
    FREE: "フリー（テスト10分保存）",
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
    name: "フリープラン（テスト10分保存）",
    price: "無料",
    features: [
      `ルーム作成数: ${PLAN_LIMITS.FREE.maxRooms}個まで`,
      `録画: ${PLAN_LIMITS.FREE.maxDailyRecordings}回/日`,
      `アップロード: ${PLAN_LIMITS.FREE.maxDailyUploads}回/日`,
      `参加者数: ${PLAN_LIMITS.FREE.maxParticipants}人まで`,
      `録画保存期間: ${PLAN_LIMITS.FREE.recordingRetentionMinutes}分間（テスト用）`,
    ],
  },
  BASIC: {
    name: "ベーシックプラン",
    price: `$${PLAN_LIMITS.BASIC.price}/月`,
    features: [
      `ルーム作成数: ${PLAN_LIMITS.BASIC.maxRooms}個まで`,
      `録画: ${PLAN_LIMITS.BASIC.maxDailyRecordings}回/日`,
      `アップロード: ${PLAN_LIMITS.BASIC.maxDailyUploads}回/日`,
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
      `アップロード: ${PLAN_LIMITS.PREMIUM.maxDailyUploads}回/日`,
      `参加者数: ${PLAN_LIMITS.PREMIUM.maxParticipants}人まで`,
      `録画保存期間: ${PLAN_LIMITS.PREMIUM.recordingRetentionDays}日間`,
      "優先サポート",
    ],
  },
} as const;

export const RECORDING_RETENTION_INFO = {
  FREE: {
    days: PLAN_LIMITS.FREE.recordingRetentionDays,
    minutes: PLAN_LIMITS.FREE.recordingRetentionMinutes,
    description:
      "フリープランでは録画は10分間保存されます（テスト用）。期限を過ぎると自動的に削除されます。",
  },
  BASIC: {
    days: PLAN_LIMITS.BASIC.recordingRetentionDays,
    description:
      "ベーシックプランでは録画は30日間保存されます。期限を過ぎると自動的に削除されます。",
  },
  PREMIUM: {
    days: PLAN_LIMITS.PREMIUM.recordingRetentionDays,
    description:
      "プレミアムプランでは録画は90日間保存されます。期限を過ぎると自動的に削除されます。",
  },
} as const;

export function getRecordingRetentionInfo(planType: PlanType) {
  return RECORDING_RETENTION_INFO[planType];
}
