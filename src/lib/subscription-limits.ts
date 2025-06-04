import { PlanType } from "@prisma/client";

export interface PlanLimits {
  maxDailyRecordings: number;
  maxParticipants: number;
  recordingRetentionDays: number;
  price: number; // 円/月
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxDailyRecordings: 1,
    maxParticipants: 2,
    recordingRetentionDays: 1,
    price: 0,
  },
  BASIC: {
    maxDailyRecordings: 3,
    maxParticipants: 2,
    recordingRetentionDays: 30,
    price: 500,
  },
  PRO: {
    maxDailyRecordings: 6,
    maxParticipants: 5,
    recordingRetentionDays: 90,
    price: 800,
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType];
}

export function getPlanName(planType: PlanType): string {
  switch (planType) {
    case "FREE":
      return "フリー";
    case "BASIC":
      return "ベーシック";
    case "PRO":
      return "プロ";
    default:
      return "フリー";
  }
}

export function getPlanDescription(planType: PlanType): string {
  switch (planType) {
    case "FREE":
      return "録画1日1回、保存期間1日";
    case "BASIC":
      return "録画1日3件、保存期間1ヶ月、パフォーマー2人";
    case "PRO":
      return "録画1日6件、保存期間3ヶ月、パフォーマー5人";
    default:
      return "";
  }
}
