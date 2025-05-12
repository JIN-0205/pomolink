import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/rooms/[roomId]/performers
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomId = (await params).roomId;
  // ルームのパフォーマー一覧を取得
  const performers = await prisma.roomParticipant.findMany({
    where: {
      roomId,
      role: "PERFORMER",
    },
    include: {
      user: true,
    },
  });

  // User情報のみ返す
  return NextResponse.json({
    performers: performers.map((p) => p.user),
  });
}
