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

// formatTime 関数など必要なヘルパー関数を追加
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

// 通知を送信する簡略化された関数
export function notifyUser(
  title: string,
  message: string,
  options?: { useVibration?: boolean }
): void {
  // 通知の設定
  const useVibration = options?.useVibration ?? true;

  // 1. ブラウザ通知（通知権限がある場合）
  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
          silent: true, // 通知音をオフ
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  } catch (error) {
    console.log("ブラウザ通知が利用できません" + error);
  }

  // 2. 振動API（モバイルデバイス用）
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

  // コンソールログ（デバッグ用）
  console.log(`通知: ${title} - ${message}`);
}

// 以前のAPIとの互換性のため
export function playNotificationSound(): void {
  // 何もせず静かに成功を返す（互換性のため）
  console.log("通知処理を実行");
}

export function sendNotification(
  title: string,
  options: NotificationOptions
): void {
  notifyUser(title, options.body || "");
}
