import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import prisma from "./db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateInviteCode(length = 8): Promise<string> {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // コードの一意性を確認
  const existingRoom = await prisma.room.findUnique({
    where: { inviteCode: result },
  });

  // 既に存在する場合は再帰的に生成
  if (existingRoom) {
    return generateInviteCode(length);
  }

  return result;
}
