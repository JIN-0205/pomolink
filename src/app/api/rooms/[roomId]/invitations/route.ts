import prisma from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { auth } from "@clerk/nextjs/server";
import { InvitationMethod, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// 環境変数の確認
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
if (!APP_URL) {
  console.warn(
    "警告: NEXT_PUBLIC_APP_URLが設定されていません。招待リンクが正しく動作しない可能性があります。"
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // ルームを取得
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          where: { userId: user.id },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "ルームが見つかりません" },
        { status: 404 }
      );
    }

    // ユーザーがルームの参加者であり、かつプランナーまたは作成者であるか確認
    const isParticipant = room.participants.length > 0;
    const isPlanner =
      isParticipant &&
      (room.participants[0].role === "PLANNER" || room.creatorId === user.id);

    if (!isParticipant || !isPlanner) {
      return NextResponse.json(
        { error: "このルームで招待を送信する権限がありません" },
        { status: 403 }
      );
    }

    // リクエストのボディを取得
    const body = await req.json();
    const { email, role = "PERFORMER", method = "EMAIL", receiverId } = body;

    // リクエストの検証
    if (method === "EMAIL" && !email) {
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    if (method === "LINK" && !room.inviteCode) {
      // 招待コードが存在しない場合は生成
      room.inviteCode = await generateUniqueInviteCode();
      await prisma.room.update({
        where: { id: roomId },
        data: { inviteCode: room.inviteCode },
      });
    }

    // 招待の有効期限（7日後）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // メソッドに応じた処理
    if (method === "EMAIL" && email) {
      try {
        // メール招待を送信する前に、同じメールで既に招待済みか確認
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            roomId,
            email,
            status: "PENDING",
            expiresAt: {
              gt: new Date(), // 期限切れでないもの
            },
          },
        });

        if (existingInvitation) {
          return NextResponse.json(
            {
              error: "既に招待メールを送信済みです",
              invitationId: existingInvitation.id,
            },
            { status: 409 }
          );
        }

        // 同じメールアドレスのユーザーが既にルームに参加しているか確認
        const existingParticipant = await prisma.user.findFirst({
          where: {
            email,
            participantRooms: {
              some: { roomId },
            },
          },
        });

        if (existingParticipant) {
          return NextResponse.json(
            {
              error: "このメールアドレスのユーザーは既にルームに参加しています",
            },
            { status: 400 }
          );
        }

        // 招待レコードを作成
        const invitation = await prisma.invitation.create({
          data: {
            email,
            role: role as UserRole,
            method: "EMAIL" as InvitationMethod,
            roomId,
            senderId: user.id,
            expiresAt,
            status: "PENDING",
          },
        });

        // 招待リンクの作成
        const inviteUrl = `${APP_URL}/join?code=${room.inviteCode}`;

        // メール送信
        const success = await sendInvitationEmail({
          email,
          senderName: user.name || "PomoLink メンバー",
          roomName: room.name,
          inviteUrl,
          inviteCode: room.inviteCode,
          expiresAt,
        });

        if (!success) {
          // メール送信に失敗した場合、招待レコードを削除
          await prisma.invitation.delete({
            where: { id: invitation.id },
          });

          return NextResponse.json(
            { error: "メールの送信に失敗しました。後でもう一度お試しください" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "招待メールを送信しました",
          invitationId: invitation.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        return NextResponse.json(
          { error: `メール送信エラー: ${errorMessage}` },
          { status: 500 }
        );
      }
    } else if (method === "LINK") {
      // 招待リンクのみを作成（データベースへの記録なし）
      return NextResponse.json({
        success: true,
        inviteCode: room.inviteCode,
        inviteLink: `${APP_URL}/join?code=${room.inviteCode}`,
      });
    } else if (method === "DIRECT" && receiverId) {
      // 特定ユーザーへの直接招待
      // ユーザーが存在するか確認
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        return NextResponse.json(
          { error: "招待先のユーザーが見つかりません" },
          { status: 404 }
        );
      }

      // 既に参加しているか確認
      const isAlreadyMember = await prisma.roomParticipant.findUnique({
        where: {
          userId_roomId: {
            userId: receiverId,
            roomId,
          },
        },
      });

      if (isAlreadyMember) {
        return NextResponse.json(
          { error: "このユーザーは既にルームに参加しています" },
          { status: 400 }
        );
      }

      // 招待レコードを作成
      const invitation = await prisma.invitation.create({
        data: {
          receiverId,
          role: role as UserRole,
          method: "LINK" as InvitationMethod,
          roomId,
          senderId: user.id,
          expiresAt,
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        message: "ユーザーに招待を送信しました",
        invitationId: invitation.id,
      });
    }

    return NextResponse.json({ error: "無効な招待方法です" }, { status: 400 });
  } catch (error) {
    console.error("[INVITATION_ERROR]", error);
    return NextResponse.json(
      { error: "招待の処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// ユニークな招待コードを生成する関数
async function generateUniqueInviteCode(length = 8): Promise<string> {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // コードの一意性を確認
  const existingRoom = await prisma.room.findUnique({
    where: { inviteCode: result },
  });

  // 既に存在する場合は再帰的に生成
  if (existingRoom) {
    return generateUniqueInviteCode(length);
  }

  return result;
}
