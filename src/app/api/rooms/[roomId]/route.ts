// app/api/rooms/[roomId]/route.ts
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ルーム詳細取得API
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

    // ルームを取得
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        mainPlanner: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // ユーザーがルームに参加しているか確認
    const isParticipant = room.participants.some((p) => p.userId === user.id);

    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("[ROOM_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// ルーム更新API
export async function PATCH(
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

    const { name, description, isPrivate } = await req.json();

    // ルームを取得
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // PLANNERロールを持つ参加者か確認
    const isPlannerOfRoom = room.participants.some(
      (p) => p.userId === user.id && p.role === "PLANNER"
    );

    if (!isPlannerOfRoom) {
      return new NextResponse("ルームの更新権限がありません", { status: 403 });
    }

    // ルームを更新
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        isPrivate: isPrivate !== undefined ? isPrivate : undefined,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("[ROOM_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// ルーム削除API
export async function DELETE(
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

    // ルームを取得
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // ルーム作成者か確認
    if (room.creatorId !== user.id) {
      return new NextResponse("ルームの削除権限がありません", { status: 403 });
    }

    // ルームを削除
    await prisma.room.delete({
      where: { id: roomId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ROOM_DELETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
