import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    // ClerkIDからデータベースのユーザーを取得
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
      },
    });

    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_ME]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
