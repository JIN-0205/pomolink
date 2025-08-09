// import prisma from "@/lib/db";
// import { withRecordingLimitCheck } from "@/lib/subscription-service";
// import { auth } from "@clerk/nextjs/server";
// import { NextRequest, NextResponse } from "next/server";

// // ポモドーロセッション作成API
// export async function POST(req: NextRequest) {
//   return withRecordingLimitCheck(req, async (request) => {
//     try {
//       const { userId: clerkId } = await auth();
//       if (!clerkId) {
//         return new NextResponse("未認証", { status: 401 });
//       }
//       const user = await prisma.user.findUnique({ where: { clerkId } });
//       if (!user) {
//         return new NextResponse("ユーザーが見つかりません", { status: 404 });
//       }
//       const body = await request.json();
//       const { taskId } = body;
//       if (!taskId) {
//         return new NextResponse("taskIdが必要です", { status: 400 });
//       }
//       // タスクとルーム参加権限チェック
//       const task = await prisma.task.findUnique({
//         where: { id: taskId },
//         include: { room: { include: { participants: true } } },
//       });
//       if (!task) {
//         return new NextResponse("タスクが見つかりません", { status: 404 });
//       }
//       const isParticipant = task.room.participants.some(
//         (p) => p.userId === user.id
//       );
//       if (!isParticipant) {
//         return new NextResponse("このタスクにアクセスする権限がありません", {
//           status: 403,
//         });
//       }
//       // Session作成
//       const session = await prisma.session.create({
//         data: {
//           userId: user.id,
//           taskId,
//           startTime: new Date(),
//           completed: false,
//         },
//       });
//       return NextResponse.json(session);
//     } catch (error) {
//       console.error("[SESSION_CREATE]", error);
//       return new NextResponse("内部エラー", { status: 500 });
//     }
//   });
// }
import prisma from "@/lib/db";
import { canRecord } from "@/lib/subscription-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("未認証", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return new NextResponse("ユーザーが見つかりません", { status: 404 });
    }

    const body = await req.json();
    const { taskId, withRecording = true } = body;
    if (!taskId) {
      return new NextResponse("taskIdが必要です", { status: 400 });
    }

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
      return new NextResponse("このタスクにアクセスする権限がありません", {
        status: 403,
      });
    }

    if (withRecording) {
      const recordingCheck = await canRecord(task.room.id, user.id);
      if (!recordingCheck.canRecord) {
        return NextResponse.json(
          {
            error: "録画制限に達しました",
            code: "RECORDING_LIMIT_EXCEEDED",
            currentCount: recordingCheck.currentCount,
            maxCount: recordingCheck.maxCount,
            planType: recordingCheck.planType,
            roomOwnerName: recordingCheck.roomOwnerName,
          },
          { status: 403 }
        );
      }
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        taskId,
        startTime: new Date(),
        completed: false,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("[SESSION_CREATE]", error);
    return new NextResponse("内部エラー", { status: 500 });
  }
}
