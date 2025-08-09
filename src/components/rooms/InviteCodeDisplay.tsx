// src/components/rooms/InviteCodeDisplay.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InviteCodeDisplayProps {
  roomId: string;
  initialCode: string;
}

export function InviteCodeDisplay({
  roomId,
  initialCode,
}: InviteCodeDisplayProps) {
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [isResetting, setIsResetting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // 招待リンクの生成
  const inviteLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/rooms/join?code=${inviteCode}`;

  // 招待リンクをコピー
  const handleCopy = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(inviteLink);
      toast("コピー完了", {
        description: "招待リンクをクリップボードにコピーしました",
      });
    } catch (error) {
      console.error("コピーに失敗しました:", error);
      toast("エラー", {
        description: "招待リンクのコピーに失敗しました",
      });
    } finally {
      setIsCopying(false);
    }
  };

  // 招待コードのリセット
  const handleReset = async () => {
    try {
      setIsResetting(true);

      const response = await fetch(`/api/rooms/${roomId}/invite-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("招待コードのリセットに失敗しました");
      }

      const data = await response.json();
      setInviteCode(data.inviteCode);

      toast("更新完了", {
        description: "新しい招待コードが生成されました",
      });
    } catch (error) {
      console.error("招待コードのリセットに失敗しました:", error);
      toast("エラー", {
        description: "招待コードのリセットに失敗しました",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>招待リンク</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input value={inviteLink} readOnly className="font-mono" />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={isCopying}
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">招待コード:</p>
              <p className="font-mono">{inviteCode}</p>
            </div>
            <Button
              variant="sub"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              リセット
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
