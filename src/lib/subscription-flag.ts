import { PlanType } from "@prisma/client";

// Dynamic flag reader to avoid build-time snapshot issues.
function readEnvFlag(name: string): string | undefined {
  return process.env[name];
}

function parseBool(val: string | undefined): boolean {
  return (val ?? "").trim().toLowerCase() === "true";
}

function parsePlan(val: string | undefined): PlanType {
  const cleaned = (val ?? "").trim().toUpperCase();
  if (cleaned === "FREE" || cleaned === "BASIC" || cleaned === "PREMIUM") {
    return cleaned as PlanType;
  }
  return "BASIC"; // safe fallback inside test mode
}

export function getFeatureFlags() {
  const billingEnabled = parseBool(readEnvFlag("ENABLE_BILLING"));
  const testMode = parseBool(readEnvFlag("TEST_MODE"));
  const defaultPlan = parsePlan(readEnvFlag("DEFAULT_PLAN_FOR_TEST"));
  return {
    BILLING_ENABLED: billingEnabled,
    TEST_MODE: testMode,
    DEFAULT_TEST_PLAN: defaultPlan,
  } as const;
}

export function isBillingEnabled(): boolean {
  const f = getFeatureFlags();
  return f.BILLING_ENABLED && !f.TEST_MODE;
}

export function getDefaultPlanForUser(): PlanType {
  const f = getFeatureFlags();
  if (f.TEST_MODE) {
    return f.DEFAULT_TEST_PLAN;
  }
  return "FREE";
}

export function isTestMode(): boolean {
  return getFeatureFlags().TEST_MODE;
}

export function canUpgradeSubscription(): boolean {
  const f = getFeatureFlags();
  return !f.TEST_MODE && f.BILLING_ENABLED;
}
