import prisma from "@/lib/db";
import { RoomWithParticipants } from "@/types";

export function getUserRole(
  room: RoomWithParticipants | null,
  userId: string | null
) {
  const participantRole =
    room?.participants.find((p) => p.userId === userId)?.role ?? null;

  const isCreator = room?.creatorId === userId;

  return {
    role: participantRole,
    isCreator,
    isPlanner: isCreator || participantRole === "PLANNER",
  };
}

/**
 * @param roomId string
 * @returns Room & { participants: Array<{ userId: string; role: "PLANNER" | "PERFORMER" }> }
 */
export async function getRoomWithParticipants(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      participants: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });
  if (!room) return null;
  return {
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
