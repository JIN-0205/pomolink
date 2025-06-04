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

    // 録画制限をチェック
    const recordingCheck = await canRecord(user.id);
    if (!recordingCheck.canRecord) {
      return NextResponse.json(
        {
          error: "録画制限に達しました",
          currentCount: recordingCheck.currentCount,
          maxCount: recordingCheck.maxCount,
          planType: recordingCheck.planType,
          needsUpgrade: true,
        },
        { status: 403 }
      );
    }

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

    // ファイルサイズ制限（100MB）
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: "ファイルサイズが大きすぎます（最大100MB）" },
        { status: 413 }
      );
    }

    const bucket = getStorage().bucket();
    const ext = file.name.split(".").pop() || "webm";
    const filename = `recordings/${user.id}/${uuidv4()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      contentType: file.type || "video/webm",
      public: false,
    });

    // サイン付きURLを生成（1年有効）
    const [fileUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    // セッションに録画URLを保存
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingUrl: fileUrl,
        recordingDuration: duration ? parseInt(duration as string) : null,
      },
    });

    // 録画使用量を記録
    await recordRecordingUsage(
      user.id,
      sessionId,
      file.size,
      duration ? parseInt(duration as string) : undefined
    );

    return NextResponse.json({
      success: true,
      recordingUrl: fileUrl,
      session,
      usage: {
        currentCount: recordingCheck.currentCount + 1,
        maxCount: recordingCheck.maxCount,
        planType: recordingCheck.planType,
      },
    });
  } catch (error) {
    console.error("[RECORDING_UPLOAD_POST]", error);
    return new NextResponse("録画アップロード失敗", { status: 500 });
  }
}

// 録画制限の確認用エンドポイント
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return new NextResponse("ユーザーが見つかりません", { status: 404 });

    const recordingCheck = await canRecord(user.id);

    return NextResponse.json(recordingCheck);
  } catch (error) {
    console.error("[RECORDING_UPLOAD_GET]", error);
    return new NextResponse("録画制限確認失敗", { status: 500 });
  }
}
