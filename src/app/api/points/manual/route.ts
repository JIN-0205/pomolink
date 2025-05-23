import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("未認証", { status: 401 });
  const planner = await prisma.user.findUnique({ where: { clerkId } });
  if (!planner)
    return new NextResponse("ユーザーが見つかりません", { status: 404 });

  const { userId, roomId, points, reason } = await req.json();
  if (!userId || !roomId || typeof points !== "number") {
    return new NextResponse("パラメータ不正", { status: 400 });
  }
  // プランナー権限チェック
  const participant = await prisma.roomParticipant.findUnique({
    where: { userId_roomId: { userId: planner.id, roomId } },
  });
  if (!participant || participant.role !== "PLANNER") {
    return new NextResponse("権限がありません", { status: 403 });
  }

  const entry = await prisma.pointHistory.create({
    data: {
      userId,
      roomId,
      type: "PLANNER_BONUS",
      points,
      reason: reason || "",
    },
  });
  return NextResponse.json({ entry });
}
