"use client";

import TaskDetail from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PomodoroSession, Recording, Task, Visit } from "@/types";
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
  // const [recordings, setRecordings] = useState<Recording[]>([]);
  const [, setRecordings] = useState<Recording[]>([]);
  // const [visits, setVisits] = useState<Visit[]>([]);
  // const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [, setVisits] = useState<Visit[]>([]);
  const [, setSessions] = useState<PomodoroSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [, setRecordingsLoading] = useState(true);
  // const [recordingsLoading, setRecordingsLoading] = useState(true);
  // const [visitsLoading, setVisitsLoading] = useState(true);
  // const [sessionsLoading, setSessionsLoading] = useState(true);
  const [, setVisitsLoading] = useState(true);
  const [, setSessionsLoading] = useState(true);

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

  // タスクの訪問履歴を取得
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setVisitsLoading(true);
        const response = await fetch(`/api/tasks/${taskId}/visits`);
        if (!response.ok) {
          setVisits([]);
          return;
        }
        const data = await response.json();
        setVisits(Array.isArray(data) ? data : []);
      } catch {
        setVisits([]);
      } finally {
        setVisitsLoading(false);
      }
    };
    if (taskId) {
      fetchVisits();
    }
  }, [taskId]);

  // タスクのポモドーロセッション一覧を取得
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) {
          setSessions([]);
          return;
        }
        const data = await response.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } catch {
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };
    if (taskId) {
      fetchSessions();
    }
  }, [taskId]);

  // ルーム一覧へ戻る
  const handleBack = () => {
    router.push(`/rooms/${roomId}?tab=tasks`);
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
        <TaskDetail task={task} />
      </div>

      {/* 録画セクション: TaskDetailコンポーネントで表示 */}
      {/* 省略: ページレベルの録画取得・表示を削除しました */}
    </div>
  );
}
