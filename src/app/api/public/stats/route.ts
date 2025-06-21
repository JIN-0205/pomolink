import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// 全ユーザー統計取得API（パブリック）
export async function GET() {
  console.log("[PUBLIC_STATS_API] API呼び出しを受信しました");

  try {
    // データベース接続テスト
    console.log("[PUBLIC_STATS_API] データベース接続を開始");

    // 統計データを並行して取得
    const [totalCompletedPomodoros, totalRooms, totalUsers] = await Promise.all(
      [
        // 全ユーザーの完了ポモドーロ数
        prisma.session.count({
          where: {
            completed: true,
          },
        }),

        // 総ルーム数
        prisma.room.count(),

        // 総ユーザー数
        prisma.user.count(),
      ]
    );

    console.log("[PUBLIC_STATS_API] 統計データ取得完了:", {
      totalCompletedPomodoros,
      totalRooms,
      totalUsers,
    });

    const stats = {
      totalCompletedPomodoros,
      totalRooms,
      totalUsers,
    };

    return NextResponse.json(stats, {
      headers: {
        // キャッシュヘッダーを追加（30分間キャッシュ）
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[PUBLIC_STATS_GET]", error);

    // フォールバック値を返す
    const fallbackStats = {
      totalCompletedPomodoros: 0,
      totalRooms: 0,
      totalUsers: 0,
    };

    return NextResponse.json(fallbackStats, {
      status: 200, // エラーでも200を返してフロントエンドが動作するようにする
      headers: {
        "Cache-Control": "public, s-maxage=60", // エラー時は短いキャッシュ
      },
    });
  }
}
