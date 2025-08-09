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

    const proposals = await prisma.taskProposal.findMany({
      where: { roomId },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("[TASK_PROPOSALS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function POST(
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

    const { title, description } = await req.json();

    if (!title?.trim()) {
      return new NextResponse("タスクタイトルは必須です", { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
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

    const userParticipant = room.participants[0];

    if (userParticipant.role !== "PERFORMER") {
      return new NextResponse("タスクの提案はパフォーマーのみ可能です", {
        status: 403,
      });
    }

    const proposal = await prisma.taskProposal.create({
      data: {
        roomId,
        proposerId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
      },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("[TASK_PROPOSALS_POST]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
