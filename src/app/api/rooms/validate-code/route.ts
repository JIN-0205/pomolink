// src/app/api/rooms/validate-code/route.ts
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new NextResponse("招待コードが必要です", { status: 400 });
    }

    // 招待コードでルームを検索
    const room = await prisma.room.findUnique({
      where: { inviteCode: code },
      select: {
        id: true,
        name: true,
        description: true,
        isPrivate: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!room) {
      return new NextResponse("無効な招待コードです", { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        participantCount: room._count.participants,
      },
    });
  } catch (error) {
    console.error("[VALIDATE_CODE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
