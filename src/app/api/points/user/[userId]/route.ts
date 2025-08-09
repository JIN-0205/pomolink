import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: requesterId } = await auth();
  if (!requesterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (await params).userId;
  const histories = await prisma.pointHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ histories });
}
