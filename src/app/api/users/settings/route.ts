import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        workAlarmSound: true,
        breakAlarmSound: true,
        soundVolume: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workAlarmSound, breakAlarmSound, soundVolume } =
      await request.json();

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        ...(workAlarmSound && { workAlarmSound }),
        ...(breakAlarmSound && { breakAlarmSound }),
        ...(soundVolume !== undefined && {
          soundVolume: parseFloat(soundVolume),
        }),
      },
      select: {
        workAlarmSound: true,
        breakAlarmSound: true,
        soundVolume: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
