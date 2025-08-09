import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!invitation) {
      return new NextResponse("招待が見つかりません", { status: 404 });
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "EXPIRED" },
      });

      return new NextResponse("招待の期限が切れています", { status: 410 });
    }

    if (invitation.status !== "PENDING") {
      return new NextResponse(
        `招待は既に${
          invitation.status === "ACCEPTED" ? "承認" : "拒否"
        }されています`,
        { status: 400 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[INVITATION_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const { status } = await req.json();

    if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
      return new NextResponse("無効なステータスです", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { invitationId } = await params;
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!invitation) {
      return new NextResponse("招待が見つかりません", { status: 404 });
    }

    if (invitation.receiverId && invitation.receiverId !== user.id) {
      return new NextResponse("この招待を処理する権限がありません", {
        status: 403,
      });
    }

    if (!invitation.receiverId && invitation.email !== user.email) {
      return new NextResponse("この招待を処理する権限がありません", {
        status: 403,
      });
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "EXPIRED" },
      });

      return new NextResponse("招待の期限が切れています", { status: 410 });
    }

    if (invitation.status !== "PENDING") {
      return new NextResponse(
        `招待は既に${
          invitation.status === "ACCEPTED" ? "承認" : "拒否"
        }されています`,
        { status: 400 }
      );
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status,
        receiverId: user.id,
      },
    });

    if (status === "ACCEPTED") {
      const isAlreadyParticipant = invitation.room.participants.some(
        (p) => p.userId === user.id
      );

      if (!isAlreadyParticipant) {
        await prisma.roomParticipant.create({
          data: {
            userId: user.id,
            roomId: invitation.roomId,
            role: invitation.role,
          },
        });
      }
    }

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error("[INVITATION_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
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

    const { invitationId } = await params;
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        room: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!invitation) {
      return new NextResponse("招待が見つかりません", { status: 404 });
    }

    if (
      invitation.senderId !== user.id &&
      invitation.room.creatorId !== user.id
    ) {
      return new NextResponse("この招待を取り消す権限がありません", {
        status: 403,
      });
    }

    if (invitation.status !== "PENDING") {
      return new NextResponse(
        `既に${
          invitation.status === "ACCEPTED" ? "承認" : "拒否"
        }された招待は取り消せません`,
        { status: 400 }
      );
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[INVITATION_DELETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
