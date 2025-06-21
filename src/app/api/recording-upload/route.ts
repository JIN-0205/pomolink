import prisma from "@/lib/db";
import { canRecord, recordRecordingUsage } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    // ユーザー取得
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return new NextResponse("ユーザーが見つかりません", { status: 404 });

    // multipart/form-dataのパース
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId");
    const duration = formData.get("duration");

    if (!file || !sessionId || typeof sessionId !== "string") {
      return new NextResponse("録画ファイルとsessionIdが必要です", {
        status: 400,
      });
    }

    // セッションの存在確認とルーム情報取得
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

    // 録画制限チェック
    const recordingCheck = await canRecord(session.task.room.id, user.id);
    if (!recordingCheck.canRecord) {
      return NextResponse.json(
        {
          error: "録画制限に達しました",
          code: "RECORDING_LIMIT_EXCEEDED",
          currentCount: recordingCheck.currentCount,
          maxCount: recordingCheck.maxCount,
          planType: recordingCheck.planType,
        },
        { status: 403 }
      );
    }

    // ファイルサイズ制限チェック (100MB)
    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return new NextResponse("ファイルサイズが大きすぎます (最大100MB)", {
        status: 413,
      });
    }

    // Firebase Storageにアップロード
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

    // 公開URLを取得
    const [fileUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: "01-01-2030",
    });

    // セッションを更新
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingUrl: fileUrl,
        recordingDuration: duration ? parseInt(duration.toString()) : null,
      },
    });

    // 録画使用量を記録
    await recordRecordingUsage(
      user.id,
      sessionId,
      file.size,
      duration ? parseInt(duration.toString()) : undefined
    );

    return NextResponse.json({
      message: "録画アップロード成功",
      session: updatedSession,
    });
  } catch (error) {
    console.error("[RECORDING_UPLOAD_POST]", error);
    return new NextResponse("録画アップロード失敗", { status: 500 });
  }
}
