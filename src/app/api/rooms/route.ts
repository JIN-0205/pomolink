import prisma from "@/lib/db";
import { adminApp } from "@/lib/firebase-admin";
import { canCreateRoom } from "@/lib/subscription-service";
import { generateInviteCode } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    const roomCreationCheck = await canCreateRoom(user.id);
    if (!roomCreationCheck.canCreate) {
      return NextResponse.json(
        {
          error: "ルーム作成数の上限に達しました",
          code: "ROOM_CREATION_LIMIT_EXCEEDED",
          currentCount: roomCreationCheck.currentCount,
          maxCount: roomCreationCheck.maxCount,
          planType: roomCreationCheck.planType,
          needsUpgrade: true,
        },
        { status: 403 }
      );
    }

    const { name, description } = await req.json();

    if (!name) {
      return new NextResponse("ルーム名は必須です", { status: 400 });
    }

    const inviteCode = await generateInviteCode();

    const room = await prisma.room.create({
      data: {
        name,
        description,
        inviteCode,
        creatorId: user.id,
        mainPlannerId: user.id,
        participants: {
          create: {
            userId: user.id,
            role: "PLANNER",
          },
        },
      },
      include: {
        participants: true,
      },
    });

    try {
      const firestore = getFirestore(adminApp);
      await firestore.collection("rooms").doc(room.id).set({
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        inviteCode: room.inviteCode,
        creatorId: room.creatorId,
        createdAt: new Date(),
      });
      await firestore
        .collection("rooms")
        .doc(room.id)
        .collection("members")
        .doc(user.id)
        .set({
          userId: user.id,
          role: "PLANNER",
          joinedAt: new Date(),
        });
    } catch (firestoreError) {
      console.error("[FIRESTORE_SYNC]", firestoreError);
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("[ROOM_CREATE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role"); // "PLANNER" または "PERFORMER"

    let participants;
    if (roleFilter === "PLANNER" || roleFilter === "PERFORMER") {
      participants = await prisma.roomParticipant.findMany({
        where: {
          userId: user.id,
          role: roleFilter,
        },
        include: {
          room: true,
        },
      });
    } else {
      participants = await prisma.roomParticipant.findMany({
        where: { userId: user.id },
        include: {
          room: true,
        },
      });
    }

    const roomsWithParticipants = await Promise.all(
      participants.map(async (participant) => {
        const participantCount = await prisma.roomParticipant.count({
          where: { roomId: participant.roomId },
        });
        const completedTaskCount = await prisma.task.count({
          where: {
            roomId: participant.roomId,
            status: "COMPLETED",
          },
        });
        return {
          room: participant.room,
          participantCount,
          completedTaskCount,
          role: participant.role,
        };
      })
    );

    return NextResponse.json(roomsWithParticipants);
  } catch (error) {
    console.error("[ROOMS_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
