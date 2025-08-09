import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; proposalId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId, proposalId } = await params;

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

    if (!room || room.participants.length === 0) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    const proposal = await prisma.taskProposal.findUnique({
      where: { id: proposalId },
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

    if (!proposal || proposal.roomId !== roomId) {
      return new NextResponse("タスク提案が見つかりません", { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("[TASK_PROPOSAL_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; proposalId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId, proposalId } = await params;

    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { status, reviewNote } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return new NextResponse("無効なステータスです", { status: 400 });
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
    const isPlanner =
      userParticipant.role === "PLANNER" || room.creatorId === user.id;

    if (!isPlanner) {
      return new NextResponse("タスク提案のレビューはプランナーのみ可能です", {
        status: 403,
      });
    }

    const proposal = await prisma.taskProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.roomId !== roomId) {
      return new NextResponse("タスク提案が見つかりません", { status: 404 });
    }

    if (proposal.status !== "PENDING") {
      return new NextResponse("この提案は既にレビュー済みです", {
        status: 400,
      });
    }

    if (status === "APPROVED") {
      const result = await prisma.$transaction(async (tx) => {
        const updatedProposal = await tx.taskProposal.update({
          where: { id: proposalId },
          data: {
            status,
            reviewedBy: user.id,
            reviewNote: reviewNote?.trim() || null,
          },
        });

        const task = await tx.task.create({
          data: {
            title: proposal.title,
            description: proposal.description,
            roomId,
            status: "TODO",
            priority: "MEDIUM",
          },
        });

        return { proposal: updatedProposal, task };
      });

      return NextResponse.json({
        proposal: result.proposal,
        task: result.task,
        message: "タスク提案を承認し、タスクを作成しました",
      });
    } else {
      const updatedProposal = await prisma.taskProposal.update({
        where: { id: proposalId },
        data: {
          status,
          reviewedBy: user.id,
          reviewNote: reviewNote?.trim() || null,
        },
      });

      return NextResponse.json({
        proposal: updatedProposal,
        message: "タスク提案を拒否しました",
      });
    }
  } catch (error) {
    console.error("[TASK_PROPOSAL_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; proposalId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId, proposalId } = await params;

    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const proposal = await prisma.taskProposal.findUnique({
      where: { id: proposalId },
      include: {
        room: {
          include: {
            participants: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!proposal || proposal.roomId !== roomId) {
      return new NextResponse("タスク提案が見つかりません", { status: 404 });
    }

    if (proposal.room.participants.length === 0) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    const userParticipant = proposal.room.participants[0];
    const isPlanner =
      userParticipant.role === "PLANNER" || proposal.room.creatorId === user.id;
    const isProposer = proposal.proposerId === user.id;

    if (!isProposer && !isPlanner) {
      return new NextResponse("この提案を削除する権限がありません", {
        status: 403,
      });
    }

    await prisma.taskProposal.delete({
      where: { id: proposalId },
    });

    return NextResponse.json({ message: "タスク提案を削除しました" });
  } catch (error) {
    console.error("[TASK_PROPOSAL_DELETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
