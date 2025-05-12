"use client";

import { JoinWithCodeForm } from "@/components/rooms/JoinWithCodeForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info, Loader2, Users, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
interface RoomInfo {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  participantCount: number;
  creator: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
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
          console.log("招待コードの検証結果:", data);
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
        <Card className="border-0 shadow-md overflow-hidden pt-0 rounded-lg">
          <div className="h-6 bg-indigo-500" />
          <CardHeader className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {roomInfo.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  招待が届いています
                </CardDescription>
              </div>
              <Badge
                // variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-100"
              >
                招待中
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1 text-indigo-500" />
                ルーム情報
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {roomInfo.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-indigo-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">参加者</p>
                    <p className="text-sm font-medium">
                      {roomInfo.participantCount}人
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
              <Avatar className="border-2 border-indigo-100">
                <AvatarImage
                  src={roomInfo.creator.imageUrl ?? undefined}
                  alt={roomInfo.creator.name || "ユーザー"}
                />
                <AvatarFallback>
                  {roomInfo.creator.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {roomInfo.creator.name}からの招待
                </p>
                <p className="text-xs text-gray-500">プランナー</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 pt-2 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/rooms")}
            >
              <X className="mr-2 h-4 w-4" /> キャンセル
            </Button>
            <Button
              className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              onClick={joinRoom}
              disabled={isJoining}
            >
              {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              参加する
            </Button>
          </CardFooter>
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
