"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import TaskDetails from "@/components/pomodoro/TaskDetails";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import TimerControls from "@/components/pomodoro/TimeControls";
import {
  formatTime,
  playNotificationSound,
  sendNotification,
} from "@/lib/utils";
import { Task } from "@/types";

// タイマーの種類
type TimerType = "work" | "break";

// タイマーの状態
type TimerState = "idle" | "running" | "paused" | "completed";

export default function PomodoroPage() {
  const router = useRouter();
  // const params = useParams();
  // const roomId = params?.roomId as string;
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  // ステート
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(!!taskId);
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [workDuration, setWorkDuration] = useState(25); // 作業時間（分）
  const [breakDuration, setBreakDuration] = useState(5); // 休憩時間（分）
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // 初期値を作業時間に設定
  const [totalTime, setTotalTime] = useState(workDuration * 60);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [standalone, setStandalone] = useState(!taskId); // タスクIDがない場合はスタンドアローンモード

  // タスク情報を取得
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        setStandalone(true);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          throw new Error("タスクの取得に失敗しました");
        }

        const data = await res.json();
        setTask(data);
      } catch (error) {
        console.error(error);
        toast("エラー", {
          description: "タスク情報の取得に失敗しました",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  // タイマー設定を変更したときに時間を更新
  useEffect(() => {
    if (timerState === "idle") {
      if (timerType === "work") {
        setTimeLeft(workDuration * 60);
        setTotalTime(workDuration * 60);
      } else {
        setTimeLeft(breakDuration * 60);
        setTotalTime(breakDuration * 60);
      }
    }
  }, [workDuration, breakDuration, timerType, timerState]);

  // タイマーの開始
  const startTimer = async () => {
    if (timerState === "running") return;

    if (timerState === "idle" && timerType === "work") {
      if (!standalone && taskId) {
        // タスク連携モード: セッション開始をAPIに記録
        try {
          const res = await fetch(`/api/pomodoro/sessions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              taskId,
            }),
          });

          if (!res.ok) {
            throw new Error("セッションの作成に失敗しました");
          }

          const data = await res.json();
          setSessionId(data.id);

          // タスクのステータスを更新
          updateTaskStatus("IN_PROGRESS");
        } catch (error) {
          console.error(error);
          toast("エラー", {
            description: "セッションの開始に失敗しました",
          });
        }
      }
    }

    setTimerState("running");
  };

  // タイマーの一時停止
  const pauseTimer = () => {
    if (timerState !== "running") return;
    setTimerState("paused");
  };

  // タイマーのスキップ
  const skipTimer = () => {
    if (timerState !== "running" && timerState !== "paused") return;
    handleTimerCompleted();
  };

  // タイマーの完了処理
  const handleTimerCompleted = async () => {
    if (timerType === "work") {
      // 作業セッション完了の処理
      if (!standalone && sessionId) {
        try {
          // セッション完了をAPIに記録
          const res = await fetch(
            `/api/pomodoro/sessions/${sessionId}/complete`,
            {
              method: "POST",
            }
          );

          if (!res.ok) {
            throw new Error("セッション完了の記録に失敗しました");
          }

          // 完了したポモドーロ数を更新
          const updatedTask = await incrementPomoCount();
          setTask(updatedTask);
        } catch (error) {
          console.error(error);
          toast("エラー", {
            description: "セッション完了の記録に失敗しました",
          });
        }
      }

      // 通知
      playNotificationSound();
      sendNotification("ポモドーロ完了", {
        body: "お疲れさまでした！休憩時間です。",
        icon: "/favicon.ico",
      });

      toast("ポモドーロ完了", {
        description: "お疲れさまでした！休憩時間です。",
      });

      // サイクル完了をインクリメント
      setCyclesCompleted((prev) => prev + 1);

      // 新しい休憩セッションに切り替え
      setTimerType("break");
      setTimeLeft(breakDuration * 60);
      setTotalTime(breakDuration * 60);
      setTimerState("idle");
    } else {
      // 休憩セッション完了の処理
      playNotificationSound();
      sendNotification("休憩完了", {
        body: "次のポモドーロを開始しましょう！",
        icon: "/favicon.ico",
      });

      toast("休憩完了", {
        description: "次のポモドーロを開始しましょう！",
      });

      // 新しい作業セッションに切り替え
      setTimerType("work");
      setTimeLeft(workDuration * 60);
      setTotalTime(workDuration * 60);
      setTimerState("idle");
      setSessionId(null); // 新しいセッションのため初期化
    }
  };

  // タスクのステータスを更新する
  const updateTaskStatus = async (
    status: "TODO" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    if (!taskId) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("タスクの更新に失敗しました");
      }

      const updatedTask = await res.json();
      setTask(updatedTask);
    } catch (error) {
      console.error(error);
    }
  };

  // ポモドーロカウントを更新
  const incrementPomoCount = async () => {
    if (!taskId || !task) return task;

    try {
      const currentCount = task.completedPomos || 0;
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completedPomos: currentCount + 1 }),
      });

      if (!res.ok) {
        throw new Error("ポモドーロカウントの更新に失敗しました");
      }

      return await res.json();
    } catch (error) {
      console.error(error);
      toast("エラー", {
        description: "ポモドーロカウントの更新に失敗しました",
      });
      return task;
    }
  };

  // タイマーのカウントダウン
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState === "running") {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            handleTimerCompleted();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [timerState, timerType]);

  // ページ離脱時の確認
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timerState === "running" || timerState === "paused") {
        e.preventDefault();
        e.returnValue = "タイマーが実行中です。本当にページを離れますか？";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [timerState]);

  // 進捗率の計算
  const calculateProgress = (): number => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div className="container py-6 max-w-3xl">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <div className="grid gap-6">
        {/* タスク情報表示 - タスクがある場合のみ表示 */}
        {!isLoading && task && <TaskDetails task={task} />}

        {/* スタンドアローンモードの設定セクション */}
        {standalone && timerState === "idle" && (
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">タイマー設定</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="workDuration" className="text-sm font-medium">
                    作業時間（分）
                  </label>
                  <Input
                    id="workDuration"
                    type="number"
                    min="1"
                    max="60"
                    value={workDuration}
                    onChange={(e) => setWorkDuration(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="breakDuration"
                    className="text-sm font-medium"
                  >
                    休憩時間（分）
                  </label>
                  <Input
                    id="breakDuration"
                    type="number"
                    min="1"
                    max="30"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ポモドーロタイマー */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  {timerType === "work" ? "作業時間" : "休憩時間"}
                </h2>
                <div className="text-6xl font-bold tabular-nums">
                  {formatTime(timeLeft)}
                </div>
              </div>

              <Progress value={calculateProgress()} className="w-full h-2" />

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <TimerControls
                  timerState={timerState}
                  onStart={startTimer}
                  onPause={pauseTimer}
                  onSkip={skipTimer}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                {timerType === "work"
                  ? "集中して作業に取り組みましょう！"
                  : "しっかり休憩をとりましょう。次のサイクルに備えてください。"}
              </div>

              {/* サイクル情報 */}
              <div className="text-sm">
                {standalone ? (
                  <>
                    完了したサイクル:{" "}
                    <span className="font-semibold">{cyclesCompleted}</span>
                  </>
                ) : (
                  <>
                    完了したポモドーロ:{" "}
                    <span className="font-semibold">
                      {task?.completedPomos || 0}
                    </span>
                    {task?.estimatedPomos && ` / ${task.estimatedPomos}`}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
