import prisma from "@/lib/db";
import { canRecord } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return new NextResponse("ユーザーが見つかりません", { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId");
    const duration = formData.get("duration");

    if (!file || !sessionId || typeof sessionId !== "string") {
      return new NextResponse("録画ファイルとsessionIdが必要です", {
        status: 400,
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        task: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!session) {
      return new NextResponse("セッションが見つかりません", { status: 404 });
    }

    if (session.userId !== user.id) {
      return new NextResponse("権限がありません", { status: 403 });
    }

    if (session.recordingUrl) {
      console.log("このセッションは既に録画済みです");
      return new NextResponse("このセッションは既に録画済みです", {
        status: 400,
      });
    }

    console.log("=== 録画制限チェック開始 ===");
    console.log("Room ID:", session.task.room.id);
    console.log("User ID:", user.id);

    const recordingCheck = await canRecord(session.task.room.id, user.id);
    console.log("録画制限チェック結果:", recordingCheck);

    if (!recordingCheck.canRecord) {
      console.log("録画制限に達しました。アップロードを拒否します。");
      const errorMessage = recordingCheck.reason || "録画制限に達しました";
      return NextResponse.json(
        {
          error: errorMessage,
          code: "RECORDING_LIMIT_EXCEEDED",
          currentCount: recordingCheck.currentCount,
          maxCount: recordingCheck.maxCount,
          planType: recordingCheck.planType,
          limitType: recordingCheck.limitType,
        },
        { status: 403 }
      );
    }
    console.log("=== 録画制限チェック完了: OK ===");

    // file size (100MB)
    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return new NextResponse("ファイルサイズが大きすぎます (最大100MB)", {
        status: 413,
      });
    }

    // upload to Firebase Storage
    const bucket = getStorage().bucket();
    const fileName = `recordings/${user.id}/${sessionId}/${uuidv4()}.webm`;
    const fileRef = bucket.file(fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          sessionId: sessionId,
          userId: user.id,
          originalName: file.name,
        },
      },
    });
    const [fileUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: "01-01-2030",
    });

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingUrl: fileUrl,
        recordingDuration: duration ? parseInt(duration.toString()) : null,
      },
    });

    return NextResponse.json({
      message: "録画アップロード成功",
      session: updatedSession,
    });
  } catch (error) {
    console.error("[RECORDING_UPLOAD_POST]", error);
    return new NextResponse("録画アップロード失敗", { status: 500 });
  }
}
