// src/components/rooms/ShareRoomDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareRoomDialogProps {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
  roomName: string;
  roomId: string;
}

export function ShareRoomDialog({
  open,
  onClose,
  inviteCode,
  roomName,
}: // roomId,
ShareRoomDialogProps) {
  const [copied, setCopied] = useState(false);

  // 招待リンクを生成
  const inviteLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/join?code=${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast("コピー完了", {
        description: "招待リンクをクリップボードにコピーしました",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy: ", error);
      toast("エラー", {
        description: "コピーに失敗しました",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{roomName}を共有</DialogTitle>
          <DialogDescription>
            以下のリンクを共有して、他のユーザーをルームに招待できます
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4">
          <Input value={inviteLink} readOnly className="flex-1" />
          <Button
            type="button"
            size="icon"
            onClick={handleCopy}
            variant="outline"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            招待コード: <span className="font-mono">{inviteCode}</span>
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>閉じる</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
