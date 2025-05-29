// app/api/rooms/[roomId]/tasks/route.ts
import { default as db, default as prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Priority, TaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// タスク作成API
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
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

    const {
      title,
      description,
      priority,
      estimatedPomos,
      dueDate,
      workDuration,
      breakDuration,
    } = await req.json();

    if (!title) {
      return new NextResponse("タスク名は必須です", { status: 400 });
    }

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

    // ユーザーがルームに参加しているか確認
    const participant = room.participants.find((p) => p.userId === user.id);

    if (!participant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    // タスク作成権限を確認
    const isPlannerOfRoom = participant.role === "PLANNER";

    if (!isPlannerOfRoom) {
      return new NextResponse("タスク作成権限がありません", { status: 403 });
    }

    // タスクを作成
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        estimatedPomos: estimatedPomos || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        workDuration: workDuration || null,
        breakDuration: breakDuration || null,
        roomId: room.id,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// タスク一覧取得API
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
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

    // ユーザーがルームに参加しているか確認
    const isParticipant = room.participants.some((p) => p.userId === user.id);

    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    // クエリパラメータから検索条件を取得
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    // タスク一覧を取得
    const tasks = await db.task.findMany({
      where: {
        roomId: roomId,
        ...(status ? { status: status as TaskStatus } : {}),
        ...(priority ? { priority: priority as Priority } : {}),
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { updatedAt: "desc" },
      ],
      include: {
        sessions: {
          orderBy: { startTime: "desc" },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
