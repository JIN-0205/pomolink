import prisma from "@/lib/db";
import { getStorage } from "@/lib/firebase-admin";
import { canUpload } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }
    const { taskId } = await params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { room: { include: { participants: true } } },
    });
    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }
    const isParticipant = task.room.participants.some(
      (p) => p.userId === user.id
    );
    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }
    const uploads = await prisma.upload.findMany({
      where: { taskId, fileUrl: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("[TASK_UPLOAD_GET]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("未認証", { status: 401 });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user)
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    const { taskId } = await params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { room: { include: { participants: true } } },
    });
    if (!task) {
      return new NextResponse("タスクが見つかりません", { status: 404 });
    }
    const isParticipant = task.room.participants.some(
      (p) => p.userId === user.id
    );
    if (!isParticipant) {
      return new NextResponse("アクセス権限がありません", { status: 403 });
    }
    const formData = await req.formData();
    const files = formData.getAll("file");
    const description = formData.get("description");
    if (!files.length) {
      return new NextResponse("ファイルが必要です", { status: 400 });
    }

    const uploadCheck = await canUpload(task.roomId, user.id, files.length);
    if (!uploadCheck.canUpload) {
      return NextResponse.json(
        {
          error: uploadCheck.reason || "アップロード制限に達しました",
          currentCount: uploadCheck.currentCount,
          maxCount: uploadCheck.maxCount,
          planType: uploadCheck.planType,
          limitType: uploadCheck.limitType,
          needsUpgrade: true,
        },
        { status: 429 }
      );
    }
    const bucket = getStorage().bucket();
    const uploadResults = [];
    for (const file of files) {
      if (typeof file === "string") continue;
      const uploadRecord = await prisma.upload.create({
        data: {
          userId: user.id,
          taskId,
          fileUrl: "",
          description:
            description && typeof description === "string"
              ? description
              : undefined,
        },
      });
      const ext = (file.name || "").split(".").pop() || "jpg";
      const filename = `submission/${uploadRecord.id}/${file.name || uuidv4() + "." + ext}`;
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
      const upload = await prisma.upload.update({
        where: { id: uploadRecord.id },
        data: { fileUrl },
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
            reason: "課題提出ボーナス",
            relatedTaskId: taskId,
          },
        });
      }
    }

    return NextResponse.json({ uploads: uploadResults });
  } catch (error) {
    console.error("[TASK_UPLOAD_POST]", error);
    return new NextResponse("アップロード失敗", { status: 500 });
  }
}
