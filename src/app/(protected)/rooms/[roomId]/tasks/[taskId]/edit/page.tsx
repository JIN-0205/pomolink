"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getUserRole } from "@/lib/utils/role";
import { RoomWithParticipants, Task } from "@/types";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// バリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  estimatedPomos: z.coerce.number().min(1).optional().nullable(),
  dueDate: z.date().optional().nullable(),
  workDuration: z.coerce.number().min(5).max(90).optional(),
  breakDuration: z.coerce.number().min(1).max(30).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTaskPageProps {
  params: Promise<{
    roomId: string;
    taskId: string;
  }>;
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  const router = useRouter();
  const { user } = useUser();

  // paramsをReact.use()でアンラップ
  const resolvedParams = React.use(params);
  const { roomId, taskId } = resolvedParams;

  const [task, setTask] = useState<Task | null>(null);
  const [room, setRoom] = useState<RoomWithParticipants | null>(null);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isPlanner } = getUserRole(room, currentUserDbId);

  // フォーム設定
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      estimatedPomos: null,
      dueDate: null,
      workDuration: 25,
      breakDuration: 5,
    },
  });

  // ユーザー情報取得
  useEffect(() => {
    const fetchUserDbId = async () => {
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/users/me`);
        if (res.ok) {
          const userData = await res.json();
          setCurrentUserDbId(userData.id);
        }
      } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
      }
    };

    fetchUserDbId();
  }, [user?.id]);

  // ルーム情報取得
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) throw new Error("ルームの取得に失敗しました");

        const data = await res.json();
        setRoom(data);
      } catch (error) {
        console.error(error);
        toast("エラー", {
          description: "ルーム情報の取得に失敗しました",
        });
        router.push(`/rooms/${roomId}`);
      }
    };

    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId, router]);

  // タスク情報取得
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast("エラー", { description: "タスクが見つかりません" });
            router.push(`/rooms/${roomId}`);
            return;
          }
          throw new Error("タスクの取得に失敗しました");
        }
        const data = await res.json();
        setTask(data);

        // フォームにデータを設定
        form.reset({
          title: data.title,
          description: data.description || "",
          priority: data.priority,
          estimatedPomos: data.estimatedPomos,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          workDuration: data.workDuration || 25,
          breakDuration: data.breakDuration || 5,
        });
      } catch (error) {
        console.error(error);
        toast("エラー", {
          description: "タスク情報の取得に失敗しました",
        });
        router.push(`/rooms/${roomId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, form, roomId, router]);

  // 権限チェック
  useEffect(() => {
    if (!isLoading && currentUserDbId && room && !isPlanner) {
      toast("エラー", {
        description: "タスクの編集権限がありません",
      });
      router.push(`/rooms/${roomId}/tasks/${taskId}`);
    }
  }, [isPlanner, isLoading, currentUserDbId, room, router, roomId, taskId]);

  // タスク更新処理
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // データの前処理と型変換
      const requestData = {
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        estimatedPomos: values.estimatedPomos || null,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        workDuration: values.workDuration || null,
        breakDuration: values.breakDuration || null,
      };

      console.log("送信するデータ:", requestData);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorMessage = "タスクの更新に失敗しました";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (error) {
          console.error("JSON parse error:", error);
        }
        throw new Error(errorMessage);
      }

      const updatedTask = await response.json();
      console.log("タスク更新成功:", updatedTask);

      toast("タスク更新完了", {
        description: "タスクを更新しました",
      });

      // タスク詳細ページに遷移
      router.push(`/rooms/${roomId}/tasks/${taskId}`);
    } catch (error) {
      console.error("タスク更新エラー:", error);
      toast("エラー", {
        description:
          error instanceof Error ? error.message : "タスクの更新に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 max-w-2xl">
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!task || !isPlanner) {
    return (
      <div className="container py-6 max-w-2xl">
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">アクセス権限がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/rooms/${roomId}/tasks/${taskId}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <h1 className="text-2xl font-bold mb-6">タスクを編集</h1>

      <Card>
        <CardHeader>
          <CardTitle>タスク情報</CardTitle>
          <CardDescription>タスクの詳細情報を編集してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              id="task-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input placeholder="タスクのタイトルを入力" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明（任意）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="タスクの詳細説明を入力"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>優先度</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="優先度を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">低</SelectItem>
                          <SelectItem value="MEDIUM">中</SelectItem>
                          <SelectItem value="HIGH">高</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedPomos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>予定ポモドーロ数（任意）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="予定ポモドーロ数"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        完了までに必要なポモドーロ数を見積もってください
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>期限日（任意）</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "yyyy年MM月dd日", {
                                locale: ja,
                              })
                            ) : (
                              <span>期限日を選択</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ja}
                          classNames={{
                            day_selected:
                              "bg-sub text-white hover:bg-sub hover:text-white",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="workDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ポモドーロ作業時間（分）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={90}
                          placeholder="25"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        5分〜90分の範囲で設定してください（推奨：25分）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="breakDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ポモドーロ休憩時間（分）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          placeholder="5"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        1分〜30分の範囲で設定してください（推奨：5分）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="sub"
            onClick={() => router.push(`/rooms/${roomId}/tasks/${taskId}`)}
          >
            キャンセル
          </Button>
          <Button type="submit" form="task-form" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "タスクを更新"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
