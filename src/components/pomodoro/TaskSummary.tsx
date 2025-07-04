import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Session, Task } from "@/types";
import React from "react";

interface TaskSummaryProps {
  task: Task;
  sessions?: Session[];
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ task, sessions = [] }) => {
  return (
    <Card>
      <CardContent className="pl-8">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{task.title}</h3>
            <div className="flex space-x-2">
              <Badge
                variant={
                  task.priority === "HIGH"
                    ? "destructive"
                    : task.priority === "MEDIUM"
                      ? "main"
                      : "sub"
                }
              >
                {task.priority === "HIGH"
                  ? "高優先度"
                  : task.priority === "MEDIUM"
                    ? "中優先度"
                    : "低優先度"}
              </Badge>
              <Badge
                // variant={
                //   task.status === "COMPLETED"
                //     ? "outline"
                //     : task.status === "IN_PROGRESS"
                //       ? "outline"
                //       : "outline"
                // }
                className={`bg-main`}
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

          <div className="mt-4 space-y-2">
            <div>
              <span className="font-semibold">セッション数:</span>{" "}
              {sessions.length}
            </div>
            <div>
              <span className="font-semibold">見積もりポモ数:</span>{" "}
              {task.estimatedPomos ?? "-"}
            </div>
            <div>
              <span className="font-semibold">完了ポモ数:</span>{" "}
              {task.completedPomos}
            </div>
            <div>
              <span className="font-semibold">期限:</span>{" "}
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskSummary;
