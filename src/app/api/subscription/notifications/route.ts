import { getPlanName } from "@/lib/subscription-limits";
import { getDailyRecordingCount } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, threshold } = body; // type: "recording" | "participants", threshold: number (percentage)

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 使用状況を取得
    let currentUsage = 0;
    let maxLimit = 0;
    let limitDescription = "";

    if (type === "recording") {
      currentUsage = await getDailyRecordingCount(user.id);
      maxLimit = user.subscription.maxDailyRecordings;
      limitDescription = "録画制限";
    } else if (type === "participants") {
      // 現在参加中のルームの参加者数をチェック（簡略化）
      currentUsage = 0; // 実際の実装では現在のルーム参加者数を取得
      maxLimit = user.subscription.maxParticipants;
      limitDescription = "参加者制限";
    }

    const usagePercentage = (currentUsage / maxLimit) * 100;

    // 閾値を超えている場合に通知
    if (usagePercentage >= threshold) {
      // メール通知を送信（実装例）
      const emailContent = {
        to: user.email,
        subject: `PomoLink ${limitDescription}警告`,
        html: `
          <h2>制限警告通知</h2>
          <p>こんにちは、</p>
          <p>あなたの${getPlanName(user.subscription.planType)}プランの${limitDescription}が${Math.round(usagePercentage)}%に達しました。</p>
          <ul>
            <li>現在の使用量: ${currentUsage}/${maxLimit}</li>
            <li>プラン: ${getPlanName(user.subscription.planType)}</li>
          </ul>
          <p>制限を解除するには、プランのアップグレードをご検討ください。</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">プランを確認</a>
        `,
      };

      // メール送信処理（実際の実装では外部サービスを使用）
      console.log("Would send email:", emailContent);

      return NextResponse.json({
        success: true,
        message: "Notification sent",
        usagePercentage: Math.round(usagePercentage),
      });
    }

    return NextResponse.json({
      success: false,
      message: "Threshold not reached",
      usagePercentage: Math.round(usagePercentage),
    });
  } catch (error) {
    console.error("Notification failed:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
