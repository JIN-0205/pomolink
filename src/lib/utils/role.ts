// role.ts

/**
 * 指定したuserIdのroleをparticipants配列から取得する
 * @param participants RoomParticipant[]
 * @param userId string
 * @returns "PLANNER" | "PERFORMER" | undefined
 */
export function getUserRole(
  participants: Array<{ userId: string; role: "PLANNER" | "PERFORMER" }>,
  userId: string
): "PLANNER" | "PERFORMER" | undefined {
  return participants.find((p) => p.userId === userId)?.role;
}
