import prisma from "@/lib/db";
import { generateInviteCode } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const roomId = (await params).roomId;
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    const isCreator = room.creatorId === user.id;
    const isPlanner = room.participants.some((p) => p.role === "PLANNER");

    if (!isCreator && !isPlanner) {
      return new NextResponse("招待コードをリセットする権限がありません", {
        status: 403,
      });
    }

    const newInviteCode = await generateInviteCode();

    const existingRoomWithCode = await prisma.room.findUnique({
      where: { inviteCode: newInviteCode },
    });

    if (existingRoomWithCode) {
      const retryCode = await generateInviteCode();

      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: { inviteCode: retryCode },
      });

      return NextResponse.json({
        success: true,
        inviteCode: updatedRoom.inviteCode,
      });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { inviteCode: newInviteCode },
    });

    return NextResponse.json({
      success: true,
      inviteCode: updatedRoom.inviteCode,
    });
  } catch (error) {
    console.error("[INVITE_CODE_RESET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
