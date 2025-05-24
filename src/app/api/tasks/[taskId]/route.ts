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
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // リクエストボディの解析
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { message: "無効なJSONデータです" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priority,
      status,
      estimatedPomos,
      completedPomos,
      dueDate,
      workDuration,
      breakDuration,
    } = requestBody;

    console.log("受信したデータ:", {
      title,
      description,
      priority,
      status,
      estimatedPomos,
      completedPomos,
      dueDate,
      workDuration,
      breakDuration,
    });

    // 入力データのバリデーション
    if (
      title !== undefined &&
      (typeof title !== "string" || title.trim() === "")
    ) {
      return NextResponse.json(
        { message: "タイトルは必須です" },
        { status: 400 }
      );
    }

    if (
      priority !== undefined &&
      !["LOW", "MEDIUM", "HIGH"].includes(priority)
    ) {
      return NextResponse.json(
        { message: "無効な優先度です" },
        { status: 400 }
      );
    }

    if (
      workDuration !== undefined &&
      (typeof workDuration !== "number" ||
        workDuration < 5 ||
        workDuration > 90)
    ) {
      return NextResponse.json(
        { message: "作業時間は5分から90分の間で設定してください" },
        { status: 400 }
      );
    }

    if (
      breakDuration !== undefined &&
      (typeof breakDuration !== "number" ||
        breakDuration < 1 ||
        breakDuration > 30)
    ) {
      return NextResponse.json(
        { message: "休憩時間は1分から30分の間で設定してください" },
        { status: 400 }
      );
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
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: "タスクが見つかりません" },
        { status: 404 }
      );
    }

    // ユーザーの参加情報を取得
    const participant = task.room.participants.find(
      (p) => p.userId === user.id
    );

    if (!participant) {
      return NextResponse.json(
        { message: "アクセス権限がありません" },
        { status: 403 }
      );
    }

    // PLANNERはすべての変更が可能、PERFORMERはステータスとcompletedPomosのみ変更可能
    if (
      participant.role !== "PLANNER" &&
      (title !== undefined ||
        description !== undefined ||
        priority !== undefined ||
        estimatedPomos !== undefined ||
        dueDate !== undefined ||
        workDuration !== undefined ||
        breakDuration !== undefined)
    ) {
      return NextResponse.json(
        { message: "タスクの更新権限がありません" },
        { status: 403 }
      );
    }

    // 型安全な更新データを構築
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (estimatedPomos !== undefined)
      updateData.estimatedPomos = estimatedPomos;
    if (completedPomos !== undefined)
      updateData.completedPomos = completedPomos;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (workDuration !== undefined) updateData.workDuration = workDuration;
    if (breakDuration !== undefined) updateData.breakDuration = breakDuration;

    console.log("更新データ:", updateData);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData as Parameters<typeof prisma.task.update>[0]["data"],
    });

    console.log("更新成功:", updatedTask);

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_PATCH] エラー詳細:", error);

    // Prismaエラーの詳細な処理
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { message: "データの競合が発生しました" },
          { status: 409 }
        );
      }
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { message: "更新対象のタスクが見つかりません" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        message: `内部エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
      },
      { status: 500 }
    );
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
