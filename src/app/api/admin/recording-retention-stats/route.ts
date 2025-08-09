import prisma from "@/lib/db";
import {
  PLAN_LIMITS,
  getRecordingRetentionInfo,
} from "@/lib/subscription-limits";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return new NextResponse("未認証", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const today = new Date();
    const stats = [];

    for (const [planType, limits] of Object.entries(PLAN_LIMITS)) {
      const retentionDays = limits.recordingRetentionDays;
      const expirationDate = new Date(today);
      expirationDate.setDate(expirationDate.getDate() - retentionDays);

      const activeRecordings = await prisma.session.count({
        where: {
          recordingUrl: {
            not: null,
          },
          createdAt: {
            gte: expirationDate,
          },
          user: {
            planType: planType as keyof typeof PLAN_LIMITS,
          },
        },
      });

      const expiredRecordings = await prisma.session.count({
        where: {
          recordingUrl: {
            not: null,
          },
          createdAt: {
            lt: expirationDate,
          },
          user: {
            planType: planType as keyof typeof PLAN_LIMITS,
          },
        },
      });

      const soonToExpire = new Date(today);
      soonToExpire.setDate(soonToExpire.getDate() - (retentionDays - 7));

      const soonToExpireRecordings = await prisma.session.count({
        where: {
          recordingUrl: {
            not: null,
          },
          createdAt: {
            gte: soonToExpire,
            lt: expirationDate,
          },
          user: {
            planType: planType as keyof typeof PLAN_LIMITS,
          },
        },
      });

      stats.push({
        planType,
        retentionDays,
        activeRecordings,
        expiredRecordings,
        soonToExpireRecordings,
        retentionInfo: getRecordingRetentionInfo(
          planType as keyof typeof PLAN_LIMITS
        ),
      });
    }

    return NextResponse.json({
      timestamp: today.toISOString(),
      stats,
    });
  } catch (error) {
    console.error("[RECORDING_RETENTION_STATS_ERROR]", error);
    return new NextResponse("内部サーバーエラー", { status: 500 });
  }
}
