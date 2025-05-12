import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; taskId: string }> }
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }
  const { roomId, taskId } = await params;
  const body = await req.json();
  const { status } = body;
  if (!status || !["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
    return NextResponse.json({ error: "不正なステータス値" }, { status: 400 });
  }
  // タスクがルームに属しているかチェック
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.roomId !== roomId) {
    return NextResponse.json(
      { error: "タスクが見つかりません" },
      { status: 404 }
    );
  }
  // ステータス更新
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
  return NextResponse.json({ task: updated });
}
