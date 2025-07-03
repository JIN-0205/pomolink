import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ユーザーが参加しているルーム一覧を取得
    const rooms = await prisma.room.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        creatorId: true,
      },
      take: 5, // 最初の5件のみ
    });

    return NextResponse.json({
      currentUser: user,
      clerkId,
      rooms,
      instructions: {
        howToTest: "以下のURLでテストしてください:",
        exampleUrl:
          rooms.length > 0
            ? `/api/debug/recording-limits?roomId=${rooms[0].id}&userId=${user.id}`
            : "参加しているルームがありません",
      },
    });
  } catch (error) {
    console.error("Get IDs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
