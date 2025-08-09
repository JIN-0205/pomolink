import prisma from "@/lib/db";
import { adminApp } from "@/lib/firebase-admin";
import { canAddParticipant } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const body = await req.json();
    const { code: inviteCode } = body;

    if (!inviteCode) {
      return new NextResponse("招待コードが必要です", { status: 400 });
    }

    console.log("Join Request:", { clerkUserId: userId, inviteCode });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.log("User not found for clerkId:", userId);
      const clerk = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (clerk.ok) {
        const clerkUser = await clerk.json();
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

          const room = await handleJoinRoom(newUser, inviteCode);
          return room;
        } catch (createError) {
          console.error("Error creating user:", createError);
          return new NextResponse("ユーザーの作成に失敗しました", {
            status: 500,
          });
        }
      } else {
        return new NextResponse(
          "ユーザーが見つかりません。アカウント設定を確認してください",
          { status: 404 }
        );
      }
    }

    return await handleJoinRoom(user, inviteCode);
  } catch (error) {
    console.error("[JOIN_ROOM]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

async function handleJoinRoom(
  user: { id: string; clerkId: string },
  inviteCode: string
) {
  const room = await prisma.room.findUnique({
    where: { inviteCode },
    include: {
      participants: true,
    },
  });

  if (!room) {
    return new NextResponse("無効な招待コードです", { status: 404 });
  }

  const existingParticipant = room.participants.find(
    (p) => p.userId === user.id
  );
  if (existingParticipant) {
    return NextResponse.json({
      alreadyJoined: true,
      roomId: room.id,
    });
  }

  const mainPlannerId = room.mainPlannerId || room.creatorId;
  const participantCheck = await canAddParticipant(room.id, mainPlannerId);

  if (!participantCheck.canAdd) {
    return NextResponse.json(
      {
        error: "参加者数の上限に達しています",
        code: "PARTICIPANT_LIMIT_EXCEEDED",
        currentCount: participantCheck.currentCount,
        maxCount: participantCheck.maxCount,
        planType: participantCheck.planType,
        needsUpgrade: true,
      },
      { status: 403 }
    );
  }

  const existingPerformer = room.participants.find(
    (p) => p.role === "PERFORMER"
  );
  const role = existingPerformer ? "PLANNER" : "PERFORMER";

  let shouldSetAsMainPlanner = false;
  if (role === "PLANNER") {
    const existingPlanners = room.participants.filter(
      (p) => p.role === "PLANNER"
    );
    shouldSetAsMainPlanner =
      existingPlanners.length === 0 && !room.mainPlannerId;

    console.log("Main planner assignment check:", {
      userId: user.id,
      role,
      existingPlannersCount: existingPlanners.length,
      currentMainPlannerId: room.mainPlannerId,
      shouldSetAsMainPlanner,
    });
  }

  await prisma.roomParticipant.create({
    data: {
      userId: user.id,
      roomId: room.id,
      role: role,
    },
  });

  if (shouldSetAsMainPlanner) {
    console.log("Setting user as main planner:", {
      userId: user.id,
      roomId: room.id,
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { mainPlannerId: user.id },
    });

    console.log("Main planner set successfully");
  }

  try {
    const firestore = getFirestore(adminApp);
    await firestore
      .collection("rooms")
      .doc(room.id)
      .collection("members")
      .doc(user.id)
      .set({
        userId: user.id,
        role: role,
        joinedAt: new Date(),
      });
  } catch (firestoreError) {
    console.error("[FIRESTORE_SYNC]", firestoreError);
  }

  return NextResponse.json({
    alreadyJoined: false,
    roomId: room.id,
    role: role,
  });
}
