// src/components/tasks/TaskList.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from "@/types";
import { PlusCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  roomId: string;
  isPlanner: boolean;
}

export function TaskList({ roomId, isPlanner }: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/rooms/${roomId}/tasks`);
        if (!res.ok) {
          throw new Error("タスクの取得に失敗しました");
        }
        const data = await res.json();
        setTasks(data);
      } catch (error) {
        console.error(error);
        toast("エラー", {
          description: "タスクの取得に失敗しました",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [roomId]);

  // 検索とフィルタリングを適用
  const filteredTasks = tasks.filter((task) => {
    // 検索クエリ
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // ステータスフィルター
    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;

    // 優先度フィルター
    const matchesPriority =
      priorityFilter === "ALL" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ステータス別にタスクをグループ化
  const todoTasks = filteredTasks.filter((task) => task.status === "TODO");
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "COMPLETED"
  );

  if (isLoading) {
    return (
      <div className="w-full grid gap-4">
        <div className="h-10 bg-muted rounded-md animate-pulse" />
        <div className="h-32 bg-muted rounded-md animate-pulse" />
        <div className="h-32 bg-muted rounded-md animate-pulse" />
        <div className="h-32 bg-muted rounded-md animate-pulse" />
      </div>
    );
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("タスクの更新に失敗しました");
      }

      // 更新成功後、タスクリストを更新
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, status: newStatus as Task["status"] }
            : task
        )
      );

      toast("更新完了", {
        description: "タスクのステータスを更新しました",
      });
    } catch (error) {
      console.error(error);
      toast("エラー", {
        description: "タスクの更新に失敗しました",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="タスクを検索..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">すべて</SelectItem>
              <SelectItem value="TODO">未着手</SelectItem>
              <SelectItem value="IN_PROGRESS">進行中</SelectItem>
              <SelectItem value="COMPLETED">完了</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="優先度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">すべて</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="LOW">低</SelectItem>
            </SelectContent>
          </Select>

          {isPlanner && (
            <Button
              onClick={() => router.push(`/rooms/${roomId}/tasks/create`)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              新規タスク
            </Button>
          )}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium">タスクがありません</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "検索条件に一致するタスクがありません"
              : "このルームにはまだタスクがありません"}
          </p>
          {isPlanner && (
            <Button
              className="mt-4"
              onClick={() => router.push(`/rooms/${roomId}/tasks/create`)}
            >
              最初のタスクを作成
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="kanban">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="kanban">かんばん</TabsTrigger>
              <TabsTrigger value="list">リスト</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {filteredTasks.length}件のタスク
            </div>
          </div>

          <TabsContent value="kanban" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>未着手</CardTitle>
                  <CardDescription>
                    {todoTasks.length}件のタスク
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todoTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      roomId={roomId}
                      onStatusChange={handleStatusChange}
                      isPlanner={isPlanner}
                      onStartPomodoro={() =>
                        router.push(
                          `/rooms/${roomId}/pomodoro?taskId=${task.id}`
                        )
                      }
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>進行中</CardTitle>
                  <CardDescription>
                    {inProgressTasks.length}件のタスク
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inProgressTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      roomId={roomId}
                      onStatusChange={handleStatusChange}
                      isPlanner={isPlanner}
                      onStartPomodoro={() =>
                        router.push(
                          `/rooms/${roomId}/pomodoro?taskId=${task.id}`
                        )
                      }
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>完了</CardTitle>
                  <CardDescription>
                    {completedTasks.length}件のタスク
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      roomId={roomId}
                      onStatusChange={handleStatusChange}
                      isPlanner={isPlanner}
                      onStartPomodoro={() =>
                        router.push(
                          `/rooms/${roomId}/pomodoro?taskId=${task.id}`
                        )
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  roomId={roomId}
                  onStatusChange={handleStatusChange}
                  isPlanner={isPlanner}
                  viewMode="list"
                  onStartPomodoro={() =>
                    router.push(`/rooms/${roomId}/pomodoro?taskId=${task.id}`)
                  }
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
