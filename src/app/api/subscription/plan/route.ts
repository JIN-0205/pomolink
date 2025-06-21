import prisma from "@/lib/db";
import { getPlanName, PLAN_LIMITS, PlanType } from "@/lib/subscription-limits";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerkから現在のプランを取得
    let currentPlanType: PlanType = "FREE";
    if (has({ plan: "premium_user" })) {
      currentPlanType = "PREMIUM";
    } else if (has({ plan: "basic_user" })) {
      currentPlanType = "BASIC";
    }

    // データベースからユーザーを取得（存在しない場合は作成）
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, planType: true, clerkId: true },
    });

    if (!user) {
      // ユーザーが存在しない場合は作成
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: "", // Clerkから取得する場合は別途実装
          planType: currentPlanType,
        },
        select: { id: true, planType: true, clerkId: true },
      });
    } else if (user.planType !== currentPlanType) {
      // データベースのプランタイプが異なる場合は更新
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
    });
  } catch (error) {
    console.error("Failed to get user plan:", error);

    // エラーの場合はFREEプランとして返す
    return NextResponse.json({
      planType: "FREE",
      planName: getPlanName("FREE"),
      planLimits: PLAN_LIMITS.FREE,
    });
  }
}
