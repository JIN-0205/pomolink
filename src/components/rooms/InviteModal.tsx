"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// 招待スキーマの定義
const emailInviteSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["PLANNER", "PERFORMER"]),
});

type EmailInviteValues = z.infer<typeof emailInviteSchema>;

interface InviteModalProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ roomId, open, onClose }: InviteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの定義
  const emailForm = useForm<EmailInviteValues>({
    resolver: zodResolver(emailInviteSchema),
    defaultValues: {
      email: "",
      role: "PERFORMER",
    },
  });

  // handleEmailInvite関数
  const handleEmailInvite = async (values: EmailInviteValues) => {
    try {
      setIsSubmitting(true);

      console.log("招待リクエスト送信:", values);

      const response = await fetch(`/api/rooms/${roomId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          role: values.role,
          method: "EMAIL",
        }),
      });

      // レスポンスの内容を取得
      const responseText = await response.text();
      console.log("APIレスポンス:", {
        status: response.status,
        ok: response.ok,
        text: responseText,
      });

      // JSONとして解析可能かチェック
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // JSONではないテキストの場合
        if (!response.ok) {
          throw new Error(responseText || "招待の送信に失敗しました");
        }
      }

      if (!response.ok) {
        // 参加者数制限の場合は特別な処理
        if (responseData?.error === "参加者数の上限に達しています") {
          throw new Error(
            "参加者数の上限に達しています。プランをアップグレードするか、既存の参加者を削除してから招待してください。"
          );
        }

        throw new Error(
          responseData?.error ||
            responseData?.message ||
            responseText ||
            "招待の送信に失敗しました"
        );
      }

      toast.success("招待送信", {
        description: "招待メールを送信しました",
      });

      // フォームをリセットして閉じる
      emailForm.reset();
      onClose();
    } catch (error) {
      console.error("メール送信エラー:", error);

      // エラーメッセージの詳細を表示
      let errorMessage = "招待の送信に失敗しました";

      if (error instanceof Error) {
        // ngrokエラーの場合は特別なメッセージ
        if (
          error.message.includes("ngrok") ||
          error.message.includes("Service Unavailable")
        ) {
          errorMessage =
            "開発環境のネットワークエラーです。メール機能は現在利用できません。";
        } else if (error.message.includes("ネットワークエラー")) {
          errorMessage =
            "ネットワークエラーが発生しました。接続を確認してください。";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error("エラー", {
        description: errorMessage,
        duration: 5000, // 5秒間表示
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 以下、コンポーネントのレンダリング部分
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>メンバーを招待</DialogTitle>
          <DialogDescription>
            メールアドレスでルームにメンバーを招待します
          </DialogDescription>
        </DialogHeader>

        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(handleEmailInvite)}
            className="space-y-4 py-4"
          >
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@email.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={emailForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ロール</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ロールを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERFORMER">パフォーマー</SelectItem>
                      <SelectItem value="PLANNER">プランナー</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                招待を送信
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
