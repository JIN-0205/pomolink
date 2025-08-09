"use client";

import { Badge } from "@/components/ui/badge";
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
import { Room, Task } from "@/types";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  Search,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// API レスポンス型定義
interface RoomApiResponse {
  room: Room;
  participantCount: number;
  role: "PLANNER" | "PERFORMER";
}

interface RoomWithTasks extends Room {
  tasks: Task[];
}

export default function TasksPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const fetchPerformerRooms = async (): Promise<Room[]> => {
    const res = await fetch("/api/rooms?role=PERFORMER");
    if (!res.ok) throw new Error("ルームの取得に失敗しました");
    const data: RoomApiResponse[] = await res.json();
    return data.map((item) => item.room);
  };

  const fetchRoomTasks = async (roomId: string): Promise<Task[]> => {
    const res = await fetch(`/api/rooms/${roomId}/tasks`);
    if (!res.ok) throw new Error("タスクの取得に失敗しました");
    const tasks: Task[] = await res.json();
    return tasks;
  };

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const performerRooms = await fetchPerformerRooms();

        const roomsWithTasks: RoomWithTasks[] = await Promise.all(
          performerRooms.map(async (room) => {
            try {
              const tasks = await fetchRoomTasks(room.id);
              return { ...room, tasks };
            } catch (error) {
              console.error(`ルーム ${room.name} のタスク取得エラー:`, error);
              return { ...room, tasks: [] };
            }
          })
        );

        setRooms(roomsWithTasks);
      } catch (error) {
        console.error("データ取得エラー:", error);
        toast("エラー", {
          description: "データの取得に失敗しました",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, user]);

  const getFilteredTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const getAllTasksStats = () => {
    const allTasks = rooms.flatMap((room) => room.tasks);
    const filteredTasks = rooms.flatMap((room) => getFilteredTasks(room.tasks));

    return {
      total: allTasks.length,
      filtered: filteredTasks.length,
      todo: filteredTasks.filter((t) => t.status === "TODO").length,
      inProgress: filteredTasks.filter((t) => t.status === "IN_PROGRESS")
        .length,
      completed: filteredTasks.filter((t) => t.status === "COMPLETED").length,
    };
  };

  const stats = getAllTasksStats();

  const handleStartPomodoro = (taskId: string, roomId: string) => {
    router.push(`/rooms/${roomId}/pomodoro?taskId=${taskId}`);
  };

  const handleTaskClick = (taskId: string, roomId: string) => {
    router.push(`/rooms/${roomId}/tasks/${taskId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "IN_PROGRESS":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "TODO":
        return "未着手";
      case "IN_PROGRESS":
        return "進行中";
      case "COMPLETED":
        return "完了";
      default:
        return status;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "main";
      case "LOW":
        return "sub";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">タスク</h1>
        <p className="text-muted-foreground">
          パフォーマーとして参加しているルームのタスクを管理できます
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">総タスク数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">未着手</p>
                <p className="text-2xl font-bold">{stats.todo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">進行中</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">完了</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="タスクを検索..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">タスクがありません</h3>
            <p className="text-muted-foreground">
              パフォーマーとして参加しているルームがないか、
              <br />
              ルームにタスクがまだ作成されていません
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => {
            const filteredTasks = getFilteredTasks(room.tasks);

            if (
              filteredTasks.length === 0 &&
              (searchQuery ||
                statusFilter !== "ALL" ||
                priorityFilter !== "ALL")
            ) {
              return null;
            }

            return (
              <Card key={room.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {room.name}
                        <Badge variant="outline">
                          {filteredTasks.length}件のタスク
                        </Badge>
                      </CardTitle>
                      <CardDescription>{room.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/rooms/${room.id}`)}
                    >
                      ルームを表示
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      タスクがありません
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleTaskClick(task.id, room.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{task.title}</h4>
                                {getStatusIcon(task.status)}
                              </div>

                              {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {task.completedPomos}/
                                    {task.estimatedPomos || "?"}ポモ
                                  </span>
                                </div>

                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      期限:{" "}
                                      {format(
                                        new Date(task.dueDate),
                                        "yyyy/MM/dd",
                                        { locale: ja }
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Badge
                                variant={getPriorityVariant(task.priority)}
                              >
                                {task.priority === "HIGH"
                                  ? "高"
                                  : task.priority === "MEDIUM"
                                    ? "中"
                                    : "低"}
                              </Badge>

                              <Badge variant="outline">
                                {getStatusLabel(task.status)}
                              </Badge>

                              {task.status !== "COMPLETED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartPomodoro(task.id, room.id);
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  開始
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
