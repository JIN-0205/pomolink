// app/api/rooms/[roomId]/invitations/route.ts
import prisma from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// 招待作成API
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { email, role, method } = await req.json();

    // ルームを取得
    const room = await prisma.room.findUnique({
      where: { id: params.roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // PLANNERロールを持つ参加者か確認
    const isPlannerOfRoom = room.participants.some(
      (p) => p.userId === user.id && p.role === "PLANNER"
    );

    if (!isPlannerOfRoom) {
      return new NextResponse("招待権限がありません", { status: 403 });
    }

    // 参加者数を確認
    const participantCount = room.participants.length;

    // サブスクリプションの上限を確認
    const maxRoomMembers = user.subscription?.maxRoomMembers || 3; // デフォルト3人

    if (participantCount >= maxRoomMembers) {
      return new NextResponse(
        `プランの上限(${maxRoomMembers}人)に達しています`,
        { status: 403 }
      );
    }

    // 招待対象ユーザーの検索（メールアドレスによる）
    let receiverId: string | null = null;

    if (email) {
      const receiver = await prisma.user.findUnique({
        where: { email },
      });

      if (receiver) {
        receiverId = receiver.id;
      }
    }

    // 有効期限を設定（例: 7日後）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 招待を作成
    const invitation = await prisma.invitation.create({
      data: {
        method: method || "LINK",
        role: role || "PERFORMER",
        email: !receiverId ? email : undefined,
        receiverId,
        senderId: user.id,
        roomId: room.id,
        expiresAt,
      },
      include: {
        room: true,
        sender: true,
      },
    });

    // メール招待の場合はメールを送信
    if (method === "EMAIL" && email) {
      await sendInvitationEmail({
        email,
        senderName: user.name || "ユーザー",
        roomName: room.name,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.id}`,
      });
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[INVITATIONS_POST]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// ルームの招待一覧取得API
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
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

    // ルームを取得
    const room = await prisma.room.findUnique({
      where: { id: params.roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // PLANNERロールを持つ参加者か確認
    const isPlannerOfRoom = room.participants.some(
      (p) => p.userId === user.id && p.role === "PLANNER"
    );

    if (!isPlannerOfRoom) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    // 招待一覧を取得
    const invitations = await prisma.invitation.findMany({
      where: { roomId: params.roomId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("[INVITATIONS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
