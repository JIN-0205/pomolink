"use client";

import TaskDetails from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Recording, Task } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface TaskPageProps {
  params: Promise<{
    roomId: string;
    taskId: string;
  }>;
}

export default function TaskPage({ params }: TaskPageProps) {
  const router = useRouter();

  // paramsをReact.use()でアンラップ
  const resolvedParams = React.use(params);
  const { roomId, taskId } = resolvedParams;

  const [task, setTask] = useState<Task | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordingsLoading, setRecordingsLoading] = useState(true);

  // タスクデータを取得
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);

        if (!response.ok) {
          throw new Error("タスクの取得に失敗しました");
        }

        const data = await response.json();
        setTask(data);
      } catch (error) {
        console.error("タスク取得エラー:", error);
        toast.error("タスクの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  // タスクの録画データを取得
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setRecordingsLoading(true);

        const response = await fetch(`/api/tasks/${taskId}/recordings`);

        // 404 (録画が見つからない) は正常ケースとして処理
        if (response.status === 404) {
          setRecordings([]);
          return;
        }

        // その他のエラーレスポンス
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("録画データ取得エラー:", errorData);
          // ユーザー向けには明示的なエラー表示はしない（UIに「録画がありません」と表示される）
          setRecordings([]);
          return;
        }

        // 正常レスポンス
        const data = await response.json();
        setRecordings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("録画データ取得例外:", error);
        setRecordings([]);
      } finally {
        setRecordingsLoading(false);
      }
    };

    if (taskId) {
      fetchRecordings();
    }
  }, [taskId]);

  // ルーム一覧へ戻る
  const handleBack = () => {
    router.push(`/rooms/${roomId}/tasks`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          タスク一覧に戻る
        </Button>
        <Card className="p-8 flex justify-center items-center">
          <p className="text-muted-foreground">タスクが見つかりませんでした</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        タスク一覧に戻る
      </Button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">タスク詳細</h2>
        <TaskDetails task={task} recordings={recordings} />
      </div>

      {/* 録画セクション */}
      {recordingsLoading ? (
        <div className="p-4 border rounded-md bg-muted/30 mt-4">
          <p className="text-sm text-muted-foreground">
            録画データを読み込み中...
          </p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="p-4 border rounded-md bg-muted/30 mt-4">
          <p className="text-sm text-muted-foreground">
            このタスクにはまだ録画データがありません。ポモドーロセッション中に録画機能を有効にすると、
            作業の様子が5分→1分のタイムラプスとして記録されます。
          </p>
        </div>
      ) : null}
    </div>
  );
}
