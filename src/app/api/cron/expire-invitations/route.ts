import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Vercel Cronジョブからのリクエストを検証
    const authHeader = req.headers.get("Authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("無効なAPIキーです", { status: 401 });
    }

    const now = new Date();

    const expiredInvitations = await prisma.invitation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    return NextResponse.json({
      success: true,
      count: expiredInvitations.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[EXPIRE_INVITATIONS_ERROR]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
