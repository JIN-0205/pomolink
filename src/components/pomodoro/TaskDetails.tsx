import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PomodoroSession, Recording, Task, Visit } from "@/types";
import React from "react";

interface TaskDetailsProps {
  task: Task;
  visits?: Visit[];
  sessions?: PomodoroSession[];
  recordings?: Recording[];
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  visits = [],
  sessions = [],
  recordings = [],
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
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

          {/* 訪問履歴・セッション・録画のサマリー表示例 */}
          <div className="mt-4 space-y-2">
            <div>
              <span className="font-semibold">訪問回数:</span> {visits.length}
            </div>
            <div>
              <span className="font-semibold">ポモドーロセッション数:</span>{" "}
              {sessions.length}
            </div>
            <div>
              <span className="font-semibold">録画数:</span> {recordings.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TaskDetails.tsxはTaskの詳細表示のみ。ポモドーロ開始ボタンはTaskDetail.tsxにのみ設置。
// TaskDetails.tsxにはポモドーロ開始ボタンを設置しないように修正。

export default TaskDetails;
