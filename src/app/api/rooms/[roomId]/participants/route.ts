import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ルーム参加者一覧取得API
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
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

    // ルームを確認
    const room = await prisma.room.findUnique({
      where: { id: params.roomId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc", // 参加順に並べる
          },
        },
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // 要求元ユーザーがルームに参加しているか確認
    const isUserInRoom = room.participants.some((p) => p.user.id === user.id);
    if (!isUserInRoom) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    return NextResponse.json(room.participants);
  } catch (error) {
    console.error("[PARTICIPANTS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
