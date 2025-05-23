import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // オプション：roomId クエリでフィルタ
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");
  const where: Prisma.PointHistoryWhereInput = { userId };
  if (roomId) where.roomId = roomId;
  const histories = await prisma.pointHistory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ histories });
}
