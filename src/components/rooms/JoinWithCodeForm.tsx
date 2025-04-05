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

export function JoinWithCodeForm() {
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
        const errorText = await response.text();
        let errorMessage = "参加に失敗しました";

        try {
          // JSONとしてパースできるか試す
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorText;
        } catch {
          // テキストのままエラーメッセージとして使用
          errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      toast.success("参加成功", {
        description: data.alreadyJoined
          ? "すでにこのルームに参加しています"
          : "ルームに参加しました",
      });

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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>コードでルームに参加</CardTitle>
        <CardDescription>
          招待コードを入力してルームに参加します
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              参加する
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
