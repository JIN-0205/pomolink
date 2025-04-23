// src/components/tasks/TaskCard.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  MoreVertical,
  PlayCircle,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskCardProps {
  task: Task;
  roomId: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
  isPlanner: boolean;
  viewMode?: "kanban" | "list";
  onStartPomodoro?: () => void;
}

export function TaskCard({
  task,
  roomId,
  onStatusChange,
  isPlanner,
  viewMode = "kanban",
  onStartPomodoro,
}: TaskCardProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/rooms/${roomId}/tasks/${task.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("このタスクを削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("タスクの削除に失敗しました");
      }

      // 親コンポーネントに削除を通知する代わりにページをリロード
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("タスクの削除に失敗しました");
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
      default:
        return priority;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "outline";
      default:
        return "outline";
    }
  };

  if (viewMode === "list") {
    return (
      <div
        className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        onClick={() => router.push(`/rooms/${roomId}/tasks/${task.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Badge variant={getPriorityVariant(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {task.completedPomos}/{task.estimatedPomos}
              </span>
              {task.dueDate && (
                <span className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {format(new Date(task.dueDate), "MM/dd", { locale: ja })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {task.status !== "COMPLETED" && (
              <>
                {task.status === "TODO" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(task.id, "IN_PROGRESS");
                    }}
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                )}
                {task.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(task.id, "COMPLETED");
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {isPlanner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
      onClick={() => router.push(`/rooms/${roomId}/tasks/${task.id}`)}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-medium truncate">{task.title}</h3>
        {isPlanner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <Badge variant={getPriorityVariant(task.priority)}>
          {getPriorityLabel(task.priority)}
        </Badge>

        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3.5 w-3.5" />
          <span>
            {task.completedPomos}/{task.estimatedPomos}
          </span>
        </div>
      </div>

      {task.status !== "COMPLETED" && (
        <div className="mt-3 flex justify-end">
          {task.status === "TODO" ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                if (onStartPomodoro) {
                  onStartPomodoro();
                } else {
                  onStatusChange(task.id, "IN_PROGRESS");
                }
              }}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              開始
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, "COMPLETED");
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              完了
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
