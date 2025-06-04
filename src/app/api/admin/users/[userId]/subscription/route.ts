import { auth } from "@clerk/nextjs/server";
import { PlanType, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: adminUserId } = await auth();

    if (!adminUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 管理者権限をチェック
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (
      !adminUser?.email?.includes("admin") &&
      !adminUser?.email?.includes("nakanojin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const {
      planType,
      maxDailyRecordings,
      maxParticipants,
      recordingRetentionDays,
    } = body;

    // 入力値の検証
    if (!Object.values(PlanType).includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // ユーザーのサブスクリプションを更新
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        planType,
        maxDailyRecordings,
        maxParticipants,
        recordingRetentionDays,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Admin subscription update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
