import prisma from "@/lib/db";
import { adminApp } from "@/lib/firebase-admin";
import { auth } from "@clerk/nextjs/server";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

// 参加者詳細取得API
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; participantId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId, participantId } = await params;
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    // ルームを確認
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // 要求元ユーザーがルームに参加しているか確認
    const isUserInRoom = room.participants.some((p) => p.userId === user.id);
    if (!isUserInRoom) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    // 参加者を取得
    const participant = await prisma.roomParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!participant || participant.roomId !== roomId) {
      return new NextResponse("参加者が見つかりません", { status: 404 });
    }

    return NextResponse.json(participant);
  } catch (error) {
    console.error("[PARTICIPANT_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// 参加者ロール更新API（PLANNER <-> PERFORMERの変更）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; participantId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId, participantId } = await params;
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const { role } = await req.json();

    if (!role || !["PLANNER", "PERFORMER"].includes(role)) {
      return new NextResponse("無効なロールです", { status: 400 });
    }

    // ルームを確認

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // ルームの作成者か確認（ロール変更は作成者だけができる）
    if (room.creatorId !== user.id) {
      return new NextResponse("ロール変更権限がありません", { status: 403 });
    }

    // 参加者を確認
    const participant = room.participants.find((p) => p.id === participantId);
    if (!participant) {
      return new NextResponse("参加者が見つかりません", { status: 404 });
    }

    // ルーム作成者のロールは変更不可
    if (participant.userId === room.creatorId) {
      return new NextResponse("ルーム作成者のロールは変更できません", {
        status: 400,
      });
    }

    // 参加者のロールを更新
    const updatedParticipant = await prisma.roomParticipant.update({
      where: { id: participantId },
      data: { role },
    });
    try {
      const firestore = getFirestore(adminApp);
      await firestore
        .collection("rooms")
        .doc(roomId)
        .collection("members")
        .doc(participant.userId)
        .update({ role });
    } catch (firestoreError) {
      console.error("[FIRESTORE_SYNC_ROLE_UPDATE]", firestoreError);
      // Firestore同期失敗時はAPIエラーにはしない
    }

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("[PARTICIPANT_PATCH]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

// 参加者削除API（退室または削除）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string; participantId: string }> }
) {
  try {
    const { userId } = await auth();
    const { roomId, participantId } = await params;
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    // ルームを確認
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return new NextResponse("ルームが見つかりません", { status: 404 });
    }

    // 参加者を確認
    const participant = await prisma.roomParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.roomId !== roomId) {
      return new NextResponse("参加者が見つかりません", { status: 404 });
    }

    // 権限チェック：
    // 1. 自分自身の退室（ただしルーム作成者は退室不可）
    // 2. PLANNERが他の参加者を削除（ただしルーム作成者は削除不可）
    const isOwnExit = participant.userId === user.id;
    const isPlannerOfRoom = room.participants.some(
      (p) => p.userId === user.id && p.role === "PLANNER"
    );

    if (isOwnExit && participant.userId === room.creatorId) {
      return new NextResponse(
        "ルーム作成者は退室できません。ルームを削除してください。",
        { status: 400 }
      );
    }

    if (!isOwnExit && !isPlannerOfRoom) {
      return new NextResponse("他の参加者を削除する権限がありません", {
        status: 403,
      });
    }

    if (!isOwnExit && participant.userId === room.creatorId) {
      return new NextResponse("ルーム作成者は削除できません", { status: 400 });
    }

    // 参加者を削除
    await prisma.roomParticipant.delete({
      where: { id: participantId },
    });

    // Firestoreからもmembersドキュメントを削除
    try {
      const firestore = getFirestore(adminApp);
      await firestore
        .collection("rooms")
        .doc(roomId)
        .collection("members")
        .doc(participant.userId)
        .delete();
    } catch (firestoreError) {
      console.error("[FIRESTORE_SYNC_DELETE]", firestoreError);
      // Firestore同期失敗はAPIエラーにはしない
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PARTICIPANT_DELETE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
