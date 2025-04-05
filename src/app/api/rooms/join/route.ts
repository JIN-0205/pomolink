// // src/app/api/rooms/join/route.ts
// import prisma from "@/lib/db";
// import { auth } from "@clerk/nextjs/server";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
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

//     const { inviteCode } = await req.json();

//     if (!inviteCode) {
//       return new NextResponse("招待コードが必要です", { status: 400 });
//     }

//     // 招待コードでルームを検索
//     const room = await prisma.room.findUnique({
//       where: { inviteCode },
//       include: {
//         participants: {
//           where: { userId: user.id },
//         },
//       },
//     });

//     if (!room) {
//       return new NextResponse("無効な招待コードです", { status: 404 });
//     }

//     // すでに参加しているか確認
//     if (room.participants.length > 0) {
//       return NextResponse.json({
//         roomId: room.id,
//         alreadyJoined: true,
//       });
//     }

//     // ルームに参加者として追加
//     await prisma.roomParticipant.create({
//       data: {
//         userId: user.id,
//         roomId: room.id,
//         role: "PERFORMER", // デフォルトはパフォーマー
//         joinedAt: new Date(),
//       },
//     });

//     return NextResponse.json({
//       roomId: room.id,
//       success: true,
//     });
//   } catch (error) {
//     console.error("[ROOM_JOIN]", error);
//     return new NextResponse("内部エラー", { status: 500 });
//   }
// }

import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    // リクエストボディから招待コードを取得
    const body = await req.json();
    const { code: inviteCode } = body;

    if (!inviteCode) {
      return new NextResponse("招待コードが必要です", { status: 400 });
    }

    // デバッグ情報をログ出力
    console.log("Join Request:", { clerkUserId: userId, inviteCode });

    // ユーザーをデータベースから取得
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // ユーザーが見つからない場合は明示的なエラーメッセージを返す
    if (!user) {
      console.log("User not found for clerkId:", userId);

      // アカウントは作成されているがデータベースのユーザーが未作成の場合は作成する
      // これはClerkで認証したものの、データベースに同期されていない場合に発生する
      const clerk = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (clerk.ok) {
        const clerkUser = await clerk.json();
        // Clerkからユーザー情報が取得できた場合は新規ユーザーとして作成
        try {
          const newUser = await prisma.user.create({
            data: {
              clerkId: userId,
              name: clerkUser.first_name
                ? `${clerkUser.first_name} ${clerkUser.last_name || ""}`
                : "ユーザー",
              email: clerkUser.email_addresses[0]?.email_address,
              imageUrl: clerkUser.image_url,
            },
          });

          console.log("Created new user:", newUser.id);

          // 新規作成したユーザーでリクエストを続行
          const room = await handleJoinRoom(newUser, inviteCode);
          return room;
        } catch (createError) {
          console.error("Error creating user:", createError);
          return new NextResponse("ユーザーの作成に失敗しました", {
            status: 500,
          });
        }
      } else {
        // Clerkからも情報が取得できない場合
        return new NextResponse(
          "ユーザーが見つかりません。アカウント設定を確認してください",
          { status: 404 }
        );
      }
    }

    // 既存ユーザーの場合はルーム参加処理を実行
    return await handleJoinRoom(user, inviteCode);
  } catch (error) {
    console.error("[JOIN_ROOM]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// ルーム参加処理を行う関数（コードの重複を避けるため分離）
async function handleJoinRoom(
  user: { id: string; clerkId: string },
  inviteCode: string
) {
  // 招待コードでルームを検索
  const room = await prisma.room.findUnique({
    where: { inviteCode },
    include: {
      participants: {
        where: { userId: user.id },
      },
    },
  });

  if (!room) {
    return new NextResponse("無効な招待コードです", { status: 404 });
  }

  // すでに参加しているか確認
  if (room.participants.length > 0) {
    return NextResponse.json({
      alreadyJoined: true,
      roomId: room.id,
    });
  }

  // 参加者として追加
  await prisma.roomParticipant.create({
    data: {
      userId: user.id,
      roomId: room.id,
      role: "PERFORMER", // デフォルトロール
    },
  });

  // 成功レスポンス
  return NextResponse.json({
    alreadyJoined: false,
    roomId: room.id,
  });
}
