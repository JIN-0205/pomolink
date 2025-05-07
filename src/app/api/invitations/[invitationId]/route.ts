// app/api/invitations/[invitationId]/route.ts
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// 招待詳細取得API
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params;
    // 招待IDで招待を取得
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

    // 招待が期限切れか確認
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      // 期限切れなら更新
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "EXPIRED" },
      });

      return new NextResponse("招待の期限が切れています", { status: 410 });
    }

    // 既に処理済みか確認
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

// 招待応答API（承認/拒否）
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
    // 招待を取得
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

    // 招待対象者確認
    if (invitation.receiverId && invitation.receiverId !== user.id) {
      return new NextResponse("この招待を処理する権限がありません", {
        status: 403,
      });
    }

    // メールのみの招待の場合、メールアドレスが一致するか確認
    if (!invitation.receiverId && invitation.email !== user.email) {
      return new NextResponse("この招待を処理する権限がありません", {
        status: 403,
      });
    }

    // 招待が期限切れか確認
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "EXPIRED" },
      });

      return new NextResponse("招待の期限が切れています", { status: 410 });
    }

    // 既に処理済みか確認
    if (invitation.status !== "PENDING") {
      return new NextResponse(
        `招待は既に${
          invitation.status === "ACCEPTED" ? "承認" : "拒否"
        }されています`,
        { status: 400 }
      );
    }

    // 招待を更新
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status,
        receiverId: user.id, // メールのみの招待だった場合は受信者IDを設定
      },
    });

    // 承認の場合はルームに参加者として追加
    if (status === "ACCEPTED") {
      // 既に参加しているか確認
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

// 招待削除API
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
    // 招待を取得
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

    // 招待対象者確認
    if (
      invitation.senderId !== user.id &&
      invitation.room.creatorId !== user.id
    ) {
      return new NextResponse("この招待を取り消す権限がありません", {
        status: 403,
      });
    }

    // ステータスチェック: PENDINGステータスの招待のみ取り消し可能
    if (invitation.status !== "PENDING") {
      return new NextResponse(
        `既に${
          invitation.status === "ACCEPTED" ? "承認" : "拒否"
        }された招待は取り消せません`,
        { status: 400 }
      );
    }

    // 招待を削除
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[INVITATION_DELETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
