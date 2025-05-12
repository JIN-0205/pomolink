"use client";

import TaskDetail from "@/components/tasks/TaskDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoomWithParticipants, Session, Task } from "@/types";
import { useUser } from "@clerk/nextjs";

import { getUserRole } from "@/lib/utils/role";
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

  // Taskと関連Sessionのみ管理
  const [task, setTask] = useState<Task | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useUser();
  const [room, setRoom] = useState<RoomWithParticipants | null>(null);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);

  const { isPlanner } = getUserRole(room, currentUserDbId);

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
      }
    };

    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  useEffect(() => {
    const fetchTaskAndSessions = async () => {
      try {
        console.log(`taskId: ${taskId}`);
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) throw new Error("タスクの取得に失敗しました");
        const data = await response.json();
        console.log("取得したタスク:", data);
        setTask(data);
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } catch (error) {
        console.error("タスク取得エラー:", error);
        toast.error("タスクの取得に失敗しました");
        setTask(null);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskAndSessions();
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
        <TaskDetail task={task} sessions={sessions} isPlanner={isPlanner} />
      </div>
    </div>
  );
}
