// app/api/tasks/[taskId]/route.ts
import { default as db, default as prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// タスク詳細取得API
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
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

    // タスクを取得
    const { taskId } = await params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
        sessions: {
          orderBy: { startTime: "desc" },
        },
      },
    });

    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }

    // ユーザーがルームに参加しているか確認
    const isParticipant = task.room.participants.some(
      (p) => p.userId === user.id
    );

    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// タスク更新API
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
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

    const {
      title,
      description,
      priority,
      status,
      estimatedPomos,
      completedPomos,
      dueDate,
    } = await req.json();

    // タスクを取得
    const { taskId } = await params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }

    // ユーザーの参加情報を取得
    const participant = task.room.participants.find(
      (p) => p.userId === user.id
    );

    if (!participant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    // PLANNERはすべての変更が可能、PERFORMERはステータスとcompletedPomosのみ変更可能
    if (
      participant.role !== "PLANNER" &&
      (title !== undefined ||
        description !== undefined ||
        priority !== undefined ||
        estimatedPomos !== undefined ||
        dueDate !== undefined)
    ) {
      return new NextResponse("タスクの更新権限がありません", { status: 403 });
    }

    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        priority: priority !== undefined ? priority : undefined,
        status: status !== undefined ? status : undefined,
        estimatedPomos:
          estimatedPomos !== undefined ? estimatedPomos : undefined,
        completedPomos:
          completedPomos !== undefined ? completedPomos : undefined,
        dueDate:
          dueDate !== undefined
            ? dueDate
              ? new Date(dueDate)
              : null
            : undefined,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// タスク削除API
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { taskId } = await params;
    // タスクを取得
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }

    // ユーザーの参加情報を取得
    const participant = task.room.participants.find(
      (p) => p.userId === user.id
    );

    if (!participant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    // PLANNERロールのみがタスクを削除できる
    if (participant.role !== "PLANNER") {
      return new NextResponse("タスクの削除権限がありません", { status: 403 });
    }

    // タスクを削除（関連するセッションも自動で削除される）
    await db.task.delete({
      where: { id: taskId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
