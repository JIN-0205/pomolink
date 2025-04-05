"use client";

import { JoinWithCodeForm } from "@/components/rooms/JoinWithCodeForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoomInfo {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  participantCount: number;
}

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");

  const [isJoining, setIsJoining] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(!!inviteCode);
  const [error, setError] = useState<string | null>(null);

  // URLに招待コードがある場合はルーム情報を取得
  useEffect(() => {
    async function validateCode() {
      if (!inviteCode) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/rooms/validate-code?code=${inviteCode}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "招待コードの検証に失敗しました");
        }

        const data = await response.json();
        if (data.valid) {
          setRoomInfo(data.room);
        } else {
          setError("無効な招待コードです");
        }
      } catch (error) {
        console.error("招待検証エラー:", error);
        setError(
          error instanceof Error
            ? error.message
            : "招待コードの検証中にエラーが発生しました"
        );
        toast.error("エラー", {
          description:
            error instanceof Error
              ? error.message
              : "招待コードの検証に失敗しました",
        });
      } finally {
        setIsLoading(false);
      }
    }

    validateCode();
  }, [inviteCode]);

  // ルームに参加する処理
  const joinRoom = async () => {
    if (!roomInfo || !inviteCode) return;

    try {
      setIsJoining(true);
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: inviteCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "ルームへの参加に失敗しました");
      }

      const data = await response.json();
      toast.success("参加完了", {
        description: data.alreadyJoined
          ? `${roomInfo.name}にはすでに参加しています`
          : `${roomInfo.name}に参加しました`,
      });

      // ルームページに遷移
      router.push(`/rooms/${data.roomId}`);
    } catch (error) {
      console.error("参加エラー:", error);
      toast.error("エラー", {
        description:
          error instanceof Error
            ? error.message
            : "ルームへの参加に失敗しました",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold">招待を確認中...</h2>
          <p className="text-muted-foreground mt-2">招待情報を検証しています</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>招待エラー</CardTitle>
            <CardDescription>招待の検証中に問題が発生しました</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-destructive">{error}</p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.push("/rooms")}>
                ルーム一覧に戻る
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 招待コードがURLにある場合の確認画面
  if (inviteCode && roomInfo) {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>ルームに参加</CardTitle>
            <CardDescription>
              以下のルームへの招待を受け取りました
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/20">
              <h3 className="font-medium text-lg">{roomInfo.name}</h3>
              {roomInfo.description && (
                <p className="text-muted-foreground mt-1">
                  {roomInfo.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">
                  参加者: {roomInfo.participantCount}人
                </span>
                {roomInfo.isPrivate ? (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    非公開
                  </span>
                ) : (
                  <span className="text-xs border px-2 py-0.5 rounded-full">
                    公開
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button onClick={joinRoom} disabled={isJoining}>
                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                参加する
              </Button>
              <Button variant="outline" onClick={() => router.push("/rooms")}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 通常のフォーム表示（URLに招待コードがない場合）
  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold text-center mb-6">
        招待コードでルームに参加
      </h1>
      <JoinWithCodeForm />
    </div>
  );
}
