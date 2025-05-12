import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ユーザーのポイント履歴を新しい順で取得
  const histories = await prisma.pointHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50, // 直近50件まで
  });

  return NextResponse.json({ histories });
}
