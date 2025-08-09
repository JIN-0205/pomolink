import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("[PUBLIC_STATS_API] API呼び出しを受信しました");

  try {
    const [totalCompletedPomodoros, totalRooms, totalUsers] = await Promise.all(
      [
        prisma.session.count({
          where: {
            completed: true,
          },
        }),

        prisma.room.count(),

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
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[PUBLIC_STATS_GET]", error);

    const fallbackStats = {
      totalCompletedPomodoros: 0,
      totalRooms: 0,
      totalUsers: 0,
    };

    return NextResponse.json(fallbackStats, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60",
      },
    });
  }
}
