import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Task } from "@/types";
import { Clock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface TaskDetailsProps {
  task: Task;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task }) => {
  const router = useRouter();

  // ポモドーロページに遷移する関数
  const startPomodoro = () => {
    router.push(`/rooms/${task.roomId}/pomodoro?taskId=${task.id}`);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{task.title}</h3>
            <div className="flex space-x-2">
              <Badge
                variant={
                  task.priority === "HIGH"
                    ? "destructive"
                    : task.priority === "MEDIUM"
                      ? "default"
                      : "outline"
                }
              >
                {task.priority === "HIGH"
                  ? "高優先度"
                  : task.priority === "MEDIUM"
                    ? "中優先度"
                    : "低優先度"}
              </Badge>
              <Badge
                variant={
                  task.status === "COMPLETED"
                    ? "secondary"
                    : task.status === "IN_PROGRESS"
                      ? "default"
                      : "outline"
                }
              >
                {task.status === "COMPLETED"
                  ? "完了"
                  : task.status === "IN_PROGRESS"
                    ? "進行中"
                    : "未着手"}
              </Badge>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          {/* ポモドーロ開始ボタン */}
          <div className="pt-2">
            <Button
              onClick={startPomodoro}
              className="w-full"
              variant="default"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              <Clock className="mr-2 h-4 w-4" />
              このタスクでポモドーロを開始
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetails;
