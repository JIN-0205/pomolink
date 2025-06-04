"use client";

import { LimitWarning } from "@/components/subscription/LimitWarning";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlanType } from "@prisma/client";
import { Loader2, Lock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "ルーム名は必須です")
    .max(100, "ルーム名は100文字以内で入力してください"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
  isPrivate: z.boolean(),
});

export function CreateRoomForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    planType: PlanType;
    dailyRecordingCount: number;
  } | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ルームの作成に失敗しました");
      }

      const room = await response.json();

      toast.success("ルームを作成しました", {
        description: `${values.name} を作成しました`,
      });

      router.push(`/rooms/${room.id}`);
    } catch (error) {
      toast.error("エラー", {
        description:
          error instanceof Error ? error.message : "ルームの作成に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch("/api/subscription/usage");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData({
            planType: data.planType,
            dailyRecordingCount: data.dailyRecordingCount,
          });
        }
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
      }
    };

    fetchSubscriptionData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center pb-6 border-b border-gray-100">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">ルーム設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          新しいポモドーロルームの詳細を設定してください
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  ルーム名 *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: チーム開発ルーム"
                    {...field}
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormDescription className="text-sm">
                  他のユーザーに表示されるルームの名前です
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">説明</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="例: フロントエンド開発チームで使用するポモドーロルームです。集中して作業しましょう！"
                    {...field}
                    value={field.value || ""}
                    rows={4}
                    className="text-base resize-none"
                  />
                </FormControl>
                <FormDescription className="text-sm">
                  ルームの目的や使い方を説明してください（任意）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="bg-gray-50 rounded-xl p-6">
                <div className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      {field.value ? (
                        <Lock className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Users className="w-5 h-5 text-green-500" />
                      )}
                      <FormLabel className="text-base font-medium">
                        {field.value
                          ? "プライベートルーム"
                          : "パブリックルーム"}
                      </FormLabel>
                    </div>
                    <FormDescription className="text-sm leading-relaxed">
                      {field.value ? (
                        <>
                          <span className="font-medium text-orange-700">
                            プライベート設定:
                          </span>
                          <br />
                          招待コードを知っているユーザーのみがルームにアクセスできます。
                          より安全でプライベートな環境を提供します。
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-green-700">
                            パブリック設定:
                          </span>
                          <br />
                          すべてのユーザーがルーム一覧からアクセスできます。
                          オープンなコラボレーション環境を提供します。
                        </>
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="ml-6"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {subscriptionData && (
            <LimitWarning
              planType={subscriptionData.planType}
              dailyRecordingCount={subscriptionData.dailyRecordingCount}
            />
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-8 py-3 h-auto"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ルームを作成
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
