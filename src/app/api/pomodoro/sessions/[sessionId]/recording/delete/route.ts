import prisma from "@/lib/db";
import { isRecordingExpired } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return new NextResponse("未認証", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        task: {
          include: {
            room: {
              include: {
                participants: {
                  where: {
                    userId: user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return new NextResponse("セッションが見つかりません", { status: 404 });
    }

    const hasAccess =
      session.userId === user.id || session.task.room.participants.length > 0;

    if (!hasAccess) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }

    if (!session.recordingUrl) {
      return new NextResponse("録画が存在しません", { status: 404 });
    }

    const expired = await isRecordingExpired(sessionId);
    if (!expired) {
      return new NextResponse("録画は期限切れではありません", { status: 400 });
    }

    try {
      await deleteFromFirebaseStorage(session.recordingUrl);
      console.log(
        `Manual deletion: Deleted recording file: ${session.recordingUrl}`
      );
    } catch (storageError) {
      console.error(
        `Manual deletion: Failed to delete file from storage: ${session.recordingUrl}`,
        storageError
      );
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingUrl: null,
        recordingDuration: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "期限切れの録画が削除されました",
    });
  } catch (error) {
    console.error("[DELETE_EXPIRED_RECORDING_ERROR]", error);
    return new NextResponse("内部サーバーエラー", { status: 500 });
  }
}

/**
 * Delete a recording file from Firebase Storage
 */
async function deleteFromFirebaseStorage(recordingUrl: string): Promise<void> {
  try {
    const storage = getStorage();

    // extract the file path from the recording URL
    const url = new URL(recordingUrl);
    const pathParam = url.pathname.split("/o/")[1];
    if (!pathParam) {
      throw new Error("Invalid recording URL format");
    }

    const filePath = decodeURIComponent(pathParam.split("?")[0]);

    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    await file.delete();

    console.log(`Successfully deleted file: ${filePath}`);
  } catch (error) {
    console.error("Firebase Storage deletion failed:", error);
    throw error;
  }
}
