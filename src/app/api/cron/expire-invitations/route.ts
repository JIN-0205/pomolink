// src/app/api/cron/expire-invitations/route.ts
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// APIキーの環境変数（本番環境では適切な認証機構を使用）
const API_KEY = process.env.CRON_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // 認証（内部APIとして保護）
    const { apiKey } = await req.json();

    if (!API_KEY || apiKey !== API_KEY) {
      return new NextResponse("無効なAPIキーです", { status: 401 });
    }

    const now = new Date();

    // 期限切れの招待をすべて「EXPIRED」ステータスに更新
    const expiredInvitations = await prisma.invitation.updateMany({
      where: {
        status: "PENDING", // 保留中の招待のみ対象
        expiresAt: {
          lt: now, // 有効期限が現在日時より前
        },
      },
      data: {
        status: "EXPIRED", // 「期限切れ」に更新
      },
    });

    // 更新統計を記録（監視やデバッグ用）
    console.log(
      `[EXPIRE_INVITATIONS] ${now.toISOString()}: ${
        expiredInvitations.count
      } invitations expired`
    );

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

// // vercel.json
// {
//   "crons": [
//     {
//       "path": "/api/cron/expire-invitations",
//       "schedule": "0 0 * * *"  // 毎日深夜0時に実行
//     }
//   ]
// }

// // Vercel Cronから呼び出されるハンドラー
// export async function handler() {
//   try {
//     const response = await fetch("https://yourapp.com/api/cron/expire-invitations", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         apiKey: process.env.CRON_API_KEY,
//       }),
//     });

//     const data = await response.json();
//     console.log(`期限切れ招待処理完了: ${data.expiredCount}件を更新`);
//   } catch (error) {
//     console.error("期限切れ招待処理に失敗:", error);
//   }
// }
