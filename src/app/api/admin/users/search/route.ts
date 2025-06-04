import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 管理者権限をチェック（実装に応じて調整）
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      !user?.email?.includes("admin") &&
      !user?.email?.includes("nakanojin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: "insensitive",
        },
      },
      include: {
        subscription: true,
      },
      take: 10, // 最大10件まで
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin user search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
