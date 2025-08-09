import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import prisma from "./db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateInviteCode(length = 8): Promise<string> {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  const existingRoom = await prisma.room.findUnique({
    where: { inviteCode: result },
  });

  if (existingRoom) {
    return generateInviteCode(length);
  }

  return result;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

export function notifyUser(
  title: string,
  message: string,
  options?: { useVibration?: boolean }
): void {
  const useVibration = options?.useVibration ?? true;

  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
          silent: true,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  } catch (error) {
    console.log("ブラウザ通知が利用できません" + error);
  }

  if (
    useVibration &&
    typeof navigator !== "undefined" &&
    "vibrate" in navigator
  ) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      console.log("振動APIが利用できません" + e);
    }
  }

  console.log(`通知: ${title} - ${message}`);
}

export function playNotificationSound(): void {
  console.log("通知処理を実行");
}

export function sendNotification(
  title: string,
  options: NotificationOptions
): void {
  notifyUser(title, options.body || "");
}
