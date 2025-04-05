// app/api/rooms/route.ts
import prisma from "@/lib/db";
import { generateInviteCode } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ルーム作成API
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const { name, description, isPrivate } = await req.json();

    if (!name) {
      return new NextResponse("ルーム名は必須です", { status: 400 });
    }

    // ユーザーのサブスクリプションプランを取得
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    // 作成したルーム数を取得して上限チェック
    const roomCount = await prisma.room.count({
      where: { creatorId: user.id },
    });

    // 無料プランのルーム制限をチェック（例: 無料プランは1ルームまで）
    if (user.subscription?.planType === "FREE" && roomCount >= 1) {
      return new NextResponse("無料プランではこれ以上ルームを作成できません", {
        status: 403,
      });
    }

    // 招待コードを生成
    const inviteCode = generateInviteCode();

    // ルームを作成
    const room = await prisma.room.create({
      data: {
        name,
        description,
        isPrivate: isPrivate ?? true,
        inviteCode,
        creatorId: user.id,
        // 作成者自身も参加者として追加
        participants: {
          create: {
            userId: user.id,
            role: "PLANNER",
          },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("[ROOMS_POST]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// ルーム一覧取得API
// export async function GET() {
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

//     // ユーザーが参加しているルームを取得
//     const participants = await prisma.roomParticipant.findMany({
//       where: { userId: user.id },
//       include: {
//         room: {
//           include: {
//             creator: {
//               select: {
//                 id: true,
//                 name: true,
//                 imageUrl: true,
//               },
//             },
//             participants: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     name: true,
//                     imageUrl: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     const rooms = participants.map((p) => p.room);

//     return NextResponse.json(rooms);
//   } catch (error) {
//     console.error("[ROOMS_GET]", error);
//     return new NextResponse("内部エラー", { status: 500 });
//   }
// }

// src/app/api/rooms/route.ts の修正
export async function GET() {
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

    // ユーザーが参加しているルームを取得
    const participants = await prisma.roomParticipant.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            participants: true,
            creator: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // フロントエンドの期待する形式に整形
    const formattedRooms = participants.map((p) => ({
      room: {
        id: p.room.id,
        name: p.room.name,
        description: p.room.description,
        inviteCode: p.room.inviteCode,
        isPrivate: p.room.isPrivate,
        createdAt: p.room.createdAt.toISOString(),
        updatedAt: p.room.updatedAt.toISOString(),
        creatorId: p.room.creatorId,
      },
      participantCount: p.room.participants.length,
      role: p.role, // 参加者自身のロール
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("[ROOMS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
