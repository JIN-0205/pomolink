import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
