import prisma from "@/lib/db";
import { canUpload } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll("file");
    const taskId = formData.get("taskId");
    const sessionId = formData.get("sessionId");
    const description = formData.get("description");

    if (!files.length || !taskId || typeof taskId !== "string") {
      return new NextResponse("ファイルとtaskIdが必要です", { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return new NextResponse("ユーザーが見つかりません", { status: 404 });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { roomId: true },
    });

    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }

    const uploadCheck = await canUpload(task.roomId, user.id, files.length);
    if (!uploadCheck.canUpload) {
      return NextResponse.json(
        {
          error: uploadCheck.reason || "アップロード制限に達しました",
          code: "UPLOAD_LIMIT_EXCEEDED",
          currentCount: uploadCheck.currentCount,
          maxCount: uploadCheck.maxCount,
          planType: uploadCheck.planType,
          limitType: uploadCheck.limitType,
        },
        { status: 403 }
      );
    }

    const bucket = getStorage().bucket();
    const uploadResults = [];
    for (const file of files) {
      if (typeof file === "string") continue;
      const ext = (file.name || "").split(".").pop() || "jpg";
      const filename = `submissions/${user.id}/${uuidv4()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileRef = bucket.file(filename);
      await fileRef.save(buffer, {
        contentType: file.type || "image/jpeg",
        public: false,
      });
      const [fileUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      const upload = await prisma.upload.create({
        data: {
          userId: user.id,
          taskId,
          sessionId:
            sessionId && typeof sessionId === "string" ? sessionId : undefined,
          fileUrl,
          description:
            description && typeof description === "string"
              ? description
              : undefined,
        },
      });
      uploadResults.push(upload);
    }
    if (uploadResults.length > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const existing = await prisma.pointHistory.findFirst({
        where: {
          userId: user.id,
          roomId: task.roomId,
          type: "SUBMISSION",
          createdAt: { gte: startOfDay },
        },
      });
      if (!existing) {
        await prisma.pointHistory.create({
          data: {
            userId: user.id,
            roomId: task.roomId,
            type: "SUBMISSION",
            points: 1,
            reason: "提出物提出ボーナス",
          },
        });
      }
    }
    return NextResponse.json({ uploads: uploadResults });
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return new NextResponse("アップロード失敗", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return new NextResponse("taskIdが必要です", { status: 400 });
    }

    const uploads = await prisma.upload.findMany({
      where: {
        taskId,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("[UPLOAD_GET]", error);
    return new NextResponse("取得失敗", { status: 500 });
  }
}
