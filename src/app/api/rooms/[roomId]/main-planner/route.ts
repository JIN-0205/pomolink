import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId } = await params;

    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        mainPlanner: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        participants: {
          where: { userId: user.id },
        },
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    if (room.participants.length === 0) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    return NextResponse.json({
      mainPlanner: room.mainPlanner,
      isMainPlanner: room.mainPlannerId === user.id,
    });
  } catch (error) {
    console.error("[MAIN_PLANNER_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId } = await params;

    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { mainPlannerId } = await req.json();

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    const isCreator = room.creatorId === user.id;
    const isCurrentMainPlanner = room.mainPlannerId === user.id;
    const hasMainPlanner = room.mainPlannerId !== null;

    if (hasMainPlanner) {
      if (!isCurrentMainPlanner) {
        return new NextResponse(
          "メインプランナーの変更権限がありません。現在のメインプランナーのみが権限を譲渡できます。",
          {
            status: 403,
          }
        );
      }
    } else {
      if (!isCreator) {
        return new NextResponse(
          "メインプランナーの設定権限がありません。ルーム作成者のみが最初の設定を行えます。",
          {
            status: 403,
          }
        );
      }
    }

    if (mainPlannerId) {
      const targetParticipant = room.participants.find(
        (p) => p.userId === mainPlannerId && p.role === "PLANNER"
      );

      if (!targetParticipant && mainPlannerId !== room.creatorId) {
        return new NextResponse(
          "指定されたユーザーはこのルームのプランナーではありません",
          { status: 400 }
        );
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { mainPlannerId },
      include: {
        mainPlanner: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      mainPlanner: updatedRoom.mainPlanner,
      message: "メインプランナーを更新しました",
    });
  } catch (error) {
    console.error("[MAIN_PLANNER_PUT]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
