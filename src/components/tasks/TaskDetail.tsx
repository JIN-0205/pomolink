"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Recording } from "@/types";
import { Task } from "@/types";
import { Clock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface TaskDetailProps {
  task: Task;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task }) => {
  const router = useRouter();

  // ポモドーロページに遷移する関数
  const startPomodoro = async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Visit作成に失敗しました");
      const data = await res.json();
      router.push(
        `/rooms/${task.roomId}/pomodoro?taskId=${task.id}&visitId=${data.id}`
      );
    } catch (error) {
      console.error(error);
      toast("エラー", { description: "訪問の作成に失敗しました" });
    }
  };

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [errorRecs, setErrorRecs] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setErrorRecs(null);
        const res = await fetch(`/api/tasks/${task.id}/recordings`, {
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("録画一覧取得失敗", text);
          setErrorRecs(text || `ステータス: ${res.status}`);
        } else {
          const data: Recording[] = await res.json();
          setRecordings(data);
        }
      } catch (e) {
        console.error("録画一覧取得エラー", e);
        setErrorRecs(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, [task.id]);

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

          {/* 録画一覧 */}
          {errorRecs && (
            <p className="text-sm text-red-500">
              録画一覧取得エラー: {errorRecs}
            </p>
          )}
          {loadingRecs ? (
            <p className="text-sm text-muted-foreground">録画を読み込み中...</p>
          ) : recordings.length > 0 ? (
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-2">録画一覧</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recordings.map((rec) => (
                  <div key={rec.id} className="border rounded p-2">
                    <video
                      src={rec.videoUrl}
                      controls
                      crossOrigin="anonymous"
                      className="w-full h-auto rounded mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      作成: {new Date(rec.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      長さ: {rec.duration}s
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              録画はまだありません。
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetail;
