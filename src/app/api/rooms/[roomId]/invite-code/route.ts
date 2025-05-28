// src/app/api/rooms/[roomId]/invite-code/route.ts
import prisma from "@/lib/db";
import { generateInviteCode } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // 認証
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

    // ルームと権限の確認
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

    // 権限チェック - 作成者またはプランナーのみ招待コードをリセット可能
    const isCreator = room.creatorId === user.id;
    const isPlanner = room.participants.some((p) => p.role === "PLANNER");

    if (!isCreator && !isPlanner) {
      return new NextResponse("招待コードをリセットする権限がありません", {
        status: 403,
      });
    }

    // 新しい招待コードを生成
    const newInviteCode = await generateInviteCode();

    // 一意性を確保（重複チェック）
    const existingRoomWithCode = await prisma.room.findUnique({
      where: { inviteCode: newInviteCode },
    });

    // 万が一重複する場合は再生成
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

    // 招待コードを更新
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
