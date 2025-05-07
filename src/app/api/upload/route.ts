import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("未認証", { status: 401 });

    // multipart/form-dataのパース
    const formData = await req.formData();
    const files = formData.getAll("file"); // 複数ファイル対応
    const taskId = formData.get("taskId");
    const sessionId = formData.get("sessionId");
    const description = formData.get("description");

    if (!files.length || !taskId || typeof taskId !== "string") {
      return new NextResponse("ファイルとtaskIdが必要です", { status: 400 });
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return new NextResponse("ユーザーが見つかりません", { status: 404 });

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
      // サイン付きURLを生成（1年有効）
      const [fileUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      // DBに記録
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

    // 画像一覧取得
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
