// // app/api/rooms/[roomId]/invitations/route.ts
// import prisma from "@/lib/db";
// import { sendInvitationEmail } from "@/lib/email";
// import { auth } from "@clerk/nextjs/server";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(
//   req: NextRequest,
//   { params }: { params: { roomId: string } }
// ) {
//   try {
//     const { roomId } = await params;
//     const { userId } = await auth();

//     if (!userId) {
//       return new NextResponse("認証が必要です", { status: 401 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { clerkId: userId },
//     });

//     if (!user) {
//       return new NextResponse("ユーザーが見つかりません", { status: 404 });
//     }

//     // ルームを取得
//     const room = await prisma.room.findUnique({
//       where: { id: roomId },
//       include: {
//         participants: {
//           where: { userId: user.id },
//         },
//       },
//     });

//     if (!room) {
//       return new NextResponse("ルームが見つかりません", { status: 404 });
//     }

//     // ユーザーがルームの参加者であり、かつプランナーまたは作成者であるか確認
//     const isParticipant = room.participants.length > 0;
//     const isPlanner =
//       isParticipant &&
//       (room.participants[0].role === "PLANNER" || room.creatorId === user.id);

//     if (!isParticipant || !isPlanner) {
//       return new NextResponse("権限がありません", { status: 403 });
//     }

//     // リクエストのボディを取得
//     const body = await req.json();
//     const { email, method } = body;

//     // 招待コードが存在しない場合は生成
//     if (!room.inviteCode) {
//       const inviteCode = generateInviteCode(6);
//       await prisma.room.update({
//         where: { id: roomId },
//         data: { inviteCode },
//       });
//       room.inviteCode = inviteCode;
//     }

//     // メール送信を実装 - method === "EMAIL"の場合のみ
//     if (method === "EMAIL" && email) {
//       // すでに参加者か確認
//       const existingUser = await prisma.user.findFirst({
//         where: { email },
//         include: {
//           participantRooms: {
//             where: { roomId },
//           },
//         },
//       });

//       if (existingUser && existingUser.participantRooms.length > 0) {
//         return new NextResponse("このユーザーはすでにルームに参加しています", {
//           status: 400,
//         });
//       }

//       // 招待の有効期限を設定 (例: 7日後)
//       const expiresAt = new Date();
//       expiresAt.setDate(expiresAt.getDate() + 7);

//       // 招待リンクの作成
//       const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?code=${room.inviteCode}`;

//       // 既存のメール送信関数を使用
//       const success = await sendInvitationEmail({
//         email,
//         senderName: user.name || "ルームメンバー",
//         roomName: room.name,
//         inviteUrl,
//         inviteCode: room.inviteCode,
//         expiresAt,
//       });

//       if (!success) {
//         console.error("メール送信に失敗しました");
//         return new NextResponse("メールの送信に失敗しました", { status: 500 });
//       }

//       // メール送信ログを保存（オプション）
//       // await prisma.invitation.create({
//       //   data: {
//       //     email,
//       //     role,
//       //     roomId,
//       //     senderId: user.id,
//       //     inviteCode: room.inviteCode,
//       //     expiresAt,
//       //   },
//       // });

//       return NextResponse.json({
//         success: true,
//         message: "招待メールを送信しました",
//       });
//     } else if (method === "LINK") {
//       // 招待リンクのみを作成
//       return NextResponse.json({
//         success: true,
//         inviteCode: room.inviteCode,
//         inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/join?code=${room.inviteCode}`,
//       });
//     }

//     return new NextResponse("無効な招待方法です", { status: 400 });
//   } catch (error) {
//     console.error("[INVITATION_ERROR]", error);
//     return new NextResponse("内部エラー", { status: 500 });
//   }
// }

// // ランダムな招待コードを生成する関数
// function generateInviteCode(length: number): string {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let result = "";
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }

import prisma from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email";
import { generateInviteCode } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  console.log("招待API呼び出し開始:", { roomId: params.roomId });

  try {
    const { roomId } = params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    console.log("認証情報:", { userId });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.log("ユーザーが見つかりません:", { clerkId: userId });
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    console.log("ユーザー情報:", { userId: user.id, name: user.name });

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
      console.log("ルームが見つかりません:", { roomId });
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    console.log("ルーム情報:", {
      roomId: room.id,
      roomName: room.name,
      participantsCount: room.participants.length,
    });

    // ユーザーがルームの参加者であり、かつプランナーまたは作成者であるか確認
    const isParticipant = room.participants.length > 0;
    const isPlanner =
      isParticipant &&
      (room.participants[0].role === "PLANNER" || room.creatorId === user.id);

    console.log("権限確認:", {
      isParticipant,
      isPlanner,
      participantRole: room.participants[0]?.role,
      isCreator: room.creatorId === user.id,
    });

    if (!isParticipant || !isPlanner) {
      return new NextResponse("権限がありません", { status: 403 });
    }

    // リクエストのボディを取得
    const body = await req.json();
    const { email, role, method } = body;

    console.log("リクエスト内容:", { email, role, method });

    // 招待コードが存在しない場合は生成
    if (!room.inviteCode) {
      const inviteCode = generateInviteCode(8);
      await prisma.room.update({
        where: { id: roomId },
        data: { inviteCode },
      });
      room.inviteCode = inviteCode;
      console.log("新しい招待コードを生成:", { inviteCode });
    }

    // メール送信を実装 - method === "EMAIL"の場合のみ
    if (method === "EMAIL" && email) {
      try {
        // APIキーの確認
        console.log("APIキー確認:", {
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasFromAddress: !!process.env.EMAIL_FROM_ADDRESS,
        });

        // 招待リンクの作成
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?code=${room.inviteCode}`;
        console.log("招待URL:", { inviteUrl });

        // メール送信実行
        console.log("メール送信を開始...");
        const success = await sendInvitationEmail({
          email,
          senderName: user.name || "ルームメンバー",
          roomName: room.name,
          inviteUrl,
          inviteCode: room.inviteCode,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
        });

        console.log("メール送信結果:", { success });

        if (!success) {
          return new NextResponse("メールの送信に失敗しました", {
            status: 500,
          });
        }

        return NextResponse.json({
          success: true,
          message: "招待メールを送信しました",
        });
      } catch (emailError) {
        console.error("メール送信エラー詳細:", emailError);
        const errorMessage =
          emailError instanceof Error ? emailError.message : "不明なエラー";
        return new NextResponse(`メール送信エラー: ${errorMessage}`, {
          status: 500,
        });
      }
    } else if (method === "LINK") {
      return NextResponse.json({
        success: true,
        inviteCode: room.inviteCode,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/join?code=${room.inviteCode}`,
      });
    }

    return new NextResponse("無効な招待方法です", { status: 400 });
  } catch (error) {
    console.error("招待処理エラー詳細:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";
    return new NextResponse(`内部エラー: ${errorMessage}`, {
      status: 500,
    });
  }
}

// ランダムな招待コードを生成する関数
// function generateInviteCode(length: number): string {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let result = "";
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }
