// src/components/rooms/JoinWithCodeForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const joinFormSchema = z.object({
  inviteCode: z.string().min(4, "招待コードは4文字以上で入力してください"),
});

type JoinFormValues = z.infer<typeof joinFormSchema>;

interface JoinWithCodeFormProps {
  onSuccess?: () => void; // 参加成功時のコールバック
  showCard?: boolean; // カード表示の有無
}

export function JoinWithCodeForm({
  onSuccess,
  showCard = true,
}: JoinWithCodeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const onSubmit = async (values: JoinFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: values.inviteCode, // 修正: キー名をAPIと合わせる
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();

          // 参加者数制限の場合は特別なメッセージを表示
          if (errorData.code === "PARTICIPANT_LIMIT_EXCEEDED") {
            throw new Error(
              "参加者数の上限に達しています。ルームオーナーにプランのアップグレードを依頼してください。"
            );
          }

          throw new Error(errorData.error || "参加に失敗しました");
        } catch (jsonError) {
          // JSONパースに失敗した場合
          if (
            jsonError instanceof Error &&
            jsonError.message.includes("参加者数の上限")
          ) {
            throw jsonError; // 上で作成したエラーメッセージをそのまま使用
          }

          // その他のエラーの場合は元のレスポンスを複製して読み込み
          const responseClone = response.clone();
          const errorText = await responseClone.text();
          throw new Error(errorText || "参加に失敗しました");
        }
      }

      const data = await response.json();

      // ロール情報を含めたトーストメッセージ
      const roleText =
        data.role === "PERFORMER" ? "パフォーマー" : "プランナー";
      toast.success("参加成功", {
        description: data.alreadyJoined
          ? "すでにこのルームに参加しています"
          : `ルームに${roleText}として参加しました`,
      });

      // 成功時コールバックを実行（ダイアログを閉じる）
      onSuccess?.();

      // 参加したルームに遷移
      router.push(`/rooms/${data.roomId}`);
    } catch (error: unknown) {
      console.error("参加エラー:", error);
      toast.error("エラー", {
        description:
          error instanceof Error ? error.message : "参加に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="inviteCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>招待コード</FormLabel>
              <FormControl>
                <Input
                  placeholder="招待コードを入力"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          参加する
        </Button>
      </form>
    </Form>
  );

  if (!showCard) {
    return <FormContent />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>コードでルームに参加</CardTitle>
        <CardDescription>
          招待コードを入力してルームに参加します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormContent />
      </CardContent>
    </Card>
  );
}
