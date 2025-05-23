import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ClerkIdからDBのUserIdを取得
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // オプション：roomId クエリでフィルタ
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");
  const where: Prisma.PointHistoryWhereInput = { userId: user.id };
  if (roomId) where.roomId = roomId;

  const histories = await prisma.pointHistory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ histories });
}
