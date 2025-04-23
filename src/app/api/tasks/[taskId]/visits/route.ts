import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// POST: /api/tasks/[taskId]/visits
export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("[VISIT_CREATE] 未認証");
      return new NextResponse("未認証", { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      console.error("[VISIT_CREATE] ユーザーが見つかりません");
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { taskId } = params;
    if (!taskId) {
      console.error("[VISIT_CREATE] taskIdが未指定");
      return new NextResponse("taskIdが必要です", { status: 400 });
    }

    // タスクが存在するかチェック
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      console.error("[VISIT_CREATE] タスクが見つかりません", taskId);
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }

    // Visitを新規作成
    const visit = await prisma.visit.create({
      data: {
        userId: user.id,
        taskId,
        startTime: new Date(),
      },
    });
    return NextResponse.json(visit);
  } catch (error) {
    console.error("[VISIT_CREATE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// GET: /api/tasks/[taskId]/visits
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("未認証", { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }
    const { taskId } = params;
    if (!taskId) {
      return new NextResponse("taskIdが必要です", { status: 400 });
    }
    // タスクが存在するかチェック
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { room: { include: { participants: true } } },
    });
    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }
    // ルーム参加者かチェック
    const isParticipant = task.room.participants.some(
      (p: { userId: string }) => p.userId === user.id
    );
    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }
    // visits取得
    const visits = await prisma.visit.findMany({
      where: { taskId },
      orderBy: { startTime: "desc" },
    });
    return NextResponse.json(visits);
  } catch (error) {
    console.error("[VISIT_LIST]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// PATCH: /api/tasks/[taskId]/visits/[visitId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string; visitId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("未認証", { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }
    const { visitId } = params;
    if (!visitId) {
      return new NextResponse("visitIdが必要です", { status: 400 });
    }
    const { endTime } = await req.json();
    if (!endTime) {
      return new NextResponse("endTimeが必要です", { status: 400 });
    }
    // visitの存在と権限チェック
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit || visit.userId !== user.id) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }
    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: { endTime: new Date(endTime) },
    });
    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("[VISIT_END]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
