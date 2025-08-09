import { PlanType } from "@prisma/client";

export const FEATURE_FLAGS = {
  BILLING_ENABLED: process.env.ENABLE_BILLING === "true",
  TEST_MODE: process.env.TEST_MODE === "true",
  DEFAULT_TEST_PLAN: (process.env.DEFAULT_PLAN_FOR_TEST as PlanType) || "BASIC",
} as const;

export function isBillingEnabled(): boolean {
  return FEATURE_FLAGS.BILLING_ENABLED && !FEATURE_FLAGS.TEST_MODE;
}

export function getDefaultPlanForUser(): PlanType {
  if (FEATURE_FLAGS.TEST_MODE) {
    return FEATURE_FLAGS.DEFAULT_TEST_PLAN;
  }
  return "FREE";
}

export function isTestMode(): boolean {
  return FEATURE_FLAGS.TEST_MODE;
}

export function canUpgradeSubscription(): boolean {
  return !FEATURE_FLAGS.TEST_MODE && FEATURE_FLAGS.BILLING_ENABLED;
}
