import prisma from "@/lib/db";
import { getDefaultPlanForUser, isTestMode } from "@/lib/subscription-flag";
import { getPlanName, PLAN_LIMITS, PlanType } from "@/lib/subscription-limits";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isTestMode()) {
      const testPlan = getDefaultPlanForUser();
      return NextResponse.json({
        planType: testPlan,
        planName: getPlanName(testPlan),
        planLimits: PLAN_LIMITS[testPlan],
        isTestMode: true,
      });
    }

    let currentPlanType: PlanType = "FREE";
    if (has({ plan: "premium_user" })) {
      currentPlanType = "PREMIUM";
    } else if (has({ plan: "basic_user" })) {
      currentPlanType = "BASIC";
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, planType: true, clerkId: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: "",
          planType: currentPlanType,
        },
        select: { id: true, planType: true, clerkId: true },
      });
    } else if (user.planType !== currentPlanType) {
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: { planType: currentPlanType },
        select: { id: true, planType: true, clerkId: true },
      });

      console.log(
        `Updated user plan from ${user.planType} to ${currentPlanType} for user ${userId}`
      );
    }

    return NextResponse.json({
      planType: currentPlanType,
      planName: getPlanName(currentPlanType),
      planLimits: PLAN_LIMITS[currentPlanType],
      isTestMode: false,
    });
  } catch (error) {
    console.error("Failed to get user plan:", error);

    const fallbackPlan = isTestMode() ? getDefaultPlanForUser() : "FREE";
    return NextResponse.json({
      planType: fallbackPlan,
      planName: getPlanName(fallbackPlan),
      planLimits: PLAN_LIMITS[fallbackPlan],
      isTestMode: isTestMode(),
    });
  }
}
