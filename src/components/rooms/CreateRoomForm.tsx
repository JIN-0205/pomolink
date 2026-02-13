"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlanType } from "@prisma/client";
import { Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SubscriptionLimitModal } from "../subscription/SubscriptionLimitModal";

interface LimitError {
  error: string;
  code: string;
  currentCount: number;
  maxCount: number;
  planType: PlanType;
  needsUpgrade: boolean;
}

const formSchema = z.object({
  name: z
    .string()
    .min(1, "ルーム名は必須です")
    .max(100, "ルーム名は100文字以内で入力してください"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
  // isPrivate: z.boolean(),
});

export function CreateRoomForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<LimitError | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      // isPrivate: true,
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
      if (response.status === 403) {
        const errorData: LimitError = await response.json();
        if (errorData.code === "ROOM_CREATION_LIMIT_EXCEEDED") {
          setLimitError(errorData);
          setShowLimitModal(true);
          return;
        }
      }

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
  const handleUpgrade = () => {
    setShowLimitModal(false);
    router.push("/pricing");
  };

  return (
    <div className="space-y-8">
      <div className="text-center pb-6 border-b border-gray-100">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600 rounded-full flex items-center justify-center">
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
                    placeholder="例: 毎日の英単語"
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
                    placeholder="例: このルームでは英単語テストを毎日行います"
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

          {/* <FormField
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
          /> */}

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
              className="px-8 py-3 h-auto bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ルームを作成
            </Button>
          </div>
        </form>
      </Form>
      {limitError && (
        <SubscriptionLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          limitType="ROOM_CREATION"
          currentPlan={limitError.planType}
          currentCount={limitError.currentCount}
          maxCount={limitError.maxCount}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
}
