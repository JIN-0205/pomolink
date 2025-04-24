"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCamera } from "@/hooks/useCamera";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { useVideoEncoder } from "@/hooks/useVideoEncoder";
import { useVideoUpload } from "@/hooks/useVideoUpload";

// タイマーの種類
type TimerType = "work" | "break";

// タイマーの状態
type TimerState = "idle" | "running" | "paused" | "completed";

export default function PomodoroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const initialVisitId = searchParams.get("visitId");

  // ステート
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(!!taskId);
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [workDuration, setWorkDuration] = useState(5); // 作業時間（分）
  const [breakDuration, setBreakDuration] = useState(1); // 休憩時間（分）
  const [timeLeft, setTimeLeft] = useState(workDuration * 60); // 初期値を作業時間に設定
  const [totalTime, setTotalTime] = useState(workDuration * 60);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null); // ←終了予定時刻（UNIX ms）を追加
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(initialVisitId);
  const [standalone, setStandalone] = useState(!taskId); // タスクIDがない場合はスタンドアローンモード

  // --- 録画・エンコード・アップロード用フック ---
  const {
    videoRef,
    error: cameraError,
    // isReady,
  } = useCamera({ width: 640, height: 360 });
  const {
    frames,
    isRecording,
    captureFrame,
    canvasRef,
    startRecording,
    stopRecording,
    clearFrames,
  } = useFrameCapture({
    captureWidth: 640,
    captureHeight: 360,
    interval: 1000,
  });
  const { encodingStatus, encodeFrames, resetStatus } = useVideoEncoder();
  const { uploadStatus, uploadVideo, resetUploadStatus } = useVideoUpload();
  const [encodedBlob, setEncodedBlob] = useState<Blob | null>(null);
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // プレビュー用URL state

  // タスク情報を取得
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        setStandalone(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          // 404の場合はタスクが存在しないのでnullをセット
          if (res.status === 404) {
            setTask(null);
            return;
          }
          throw new Error("タスクの取得に失敗しました");
        }

        const data = await res.json();
        setTask(data);
      } catch (error) {
        console.error(error);
        toast("エラー", {
          description: "タスク情報の取得に失敗しました",
        });
        setTask(null);
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
        setTimerEndTime(null);
      } else {
        setTimeLeft(breakDuration * 60);
        setTotalTime(breakDuration * 60);
        setTimerEndTime(null);
      }
    }
  }, [workDuration, breakDuration, timerType, timerState]);

  // タイマーの開始
  const startTimer = async () => {
    if (timerState === "running") return;

    console.log("startTimer 呼び出し");

    if (timerState === "idle" && timerType === "work") {
      if (!standalone && taskId) {
        try {
          // Visitが未作成なら作成し、ローカルに保存
          if (visitId === null) {
            const visitRes = await fetch(`/api/tasks/${taskId}/visits`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            if (!visitRes.ok) throw new Error("Visit作成失敗");
            const visitData = await visitRes.json();
            setVisitId(visitData.id);
          }

          // PomoSessionを作成
          const res = await fetch(`/api/pomodoro/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, visitId }),
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error("Session create API error:", res.status, errText);
            throw new Error("セッション作成失敗");
          }
          const data = await res.json();
          setSessionId(data.id);
          updateTaskStatus("IN_PROGRESS");
        } catch (error) {
          console.error(error);
          toast("エラー", { description: "セッションの開始に失敗しました" });
          return; // セッション作成失敗時は進まない
        }
      }

      // 録画に必要な初期化
      console.log("録画開始準備");
      clearFrames(); // 前回のフレームをクリア
      setEncodedBlob(null);
      setPreviewUrl(null);
      resetStatus();
      resetUploadStatus();

      // タイマー状態を変更する前に録画を開始
      startRecording();
      console.log("startRecording 呼び出し完了");
    }

    // タイマー状態を変更（録画開始の後に行う）
    console.log("タイマー状態を running に設定");
    // 終了予定時刻をセット
    const durationSec =
      timerType === "work" ? workDuration * 60 : breakDuration * 60;
    setTimerEndTime(Date.now() + durationSec * 1000);
    setTimerState("running");
  };

  // タイマーの一時停止
  const pauseTimer = () => {
    if (timerState !== "running") return;
    setTimerState("paused");
    setTimerEndTime(null); // 一時停止時は終了予定時刻をクリア
  };

  // タイマーのスキップ
  const skipTimer = () => {
    if (timerState !== "running" && timerState !== "paused") return;
    setTimerEndTime(null); // スキップ時もクリア
    handleTimerCompleted();
  };

  // 動画保存（アップロード）
  const handleSaveVideo = useCallback(async () => {
    if (!encodedBlob || !sessionId) return;
    try {
      // 1. Firebase Storage にアップロード
      const downloadUrl = await uploadVideo(
        encodedBlob,
        `timelapse/pomodoro-${sessionId}-${Date.now()}.mp4`
      );

      // 2. pomoSession を更新
      await fetch(`/api/pomodoro/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: downloadUrl,
          endTime: new Date().toISOString(),
          completed: true,
        }),
      });

      toast("動画を保存しました");
    } catch (error) {
      console.error("保存中にエラー:", error);
      toast("エラー", { description: "動画の保存に失敗しました" });
    } finally {
      // ダイアログ閉じてクリア
      setShowVideoConfirm(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setEncodedBlob(null);
      resetStatus();
      clearFrames();
    }
  }, [
    encodedBlob,
    sessionId,
    uploadVideo,
    previewUrl,
    resetStatus,
    clearFrames,
  ]);

  // 動画破棄
  const handleDiscardVideo = useCallback(async () => {
    // 「キャンセル」時はセッション完了だけPATCH
    if (sessionId) {
      try {
        await fetch(`/api/pomodoro/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endTime: new Date().toISOString(),
            completed: true,
          }),
        });
        toast("動画を破棄しました");
      } catch (error) {
        console.error("セッション更新エラー:", error);
      }
    }
    setShowVideoConfirm(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setEncodedBlob(null);
    resetStatus();
    clearFrames();
  }, [sessionId, previewUrl, resetStatus, clearFrames]);

  // タイマーの完了処理
  const handleTimerCompleted = useCallback(async () => {
    setTimerEndTime(null); // 完了時もクリア
    if (timerType === "work") {
      // 録画停止
      stopRecording();

      // 通知とタイマー状態更新（早めに更新）
      sendNotification("ポモドーロ完了", {
        body: "お疲れさまでした！休憩時間です。",
        icon: "/favicon.ico",
      });
      toast("ポモドーロ完了", {
        description: "お疲れさまでした！休憩時間です。",
      });
      setCyclesCompleted((prev) => prev + 1);
      setTimerType("break");
      setTimeLeft(breakDuration * 60);
      setTotalTime(breakDuration * 60);
      setTimerState("idle");

      // 最後のフレームを確実にキャプチャ
      if (videoRef.current) {
        captureFrame(videoRef.current);
      }

      // 少し待ってからフレームの状況を確認
      await new Promise((resolve) => setTimeout(resolve, 500));

      // フレームが空の場合は手動でキャプチャを試みる
      if (frames.length === 0 && videoRef.current) {
        console.log("フレームが空のため手動キャプチャを実行");
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 640;
        tempCanvas.height = 360;
        const ctx = tempCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            videoRef.current,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          frames.push(tempCanvas);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(`キャプチャしたフレーム: ${frames.length}枚`);

      // フレームがある場合のみエンコード
      if (frames.length > 0) {
        try {
          const blob = await encodeFrames(frames, {
            width: 640,
            height: 360,
            fps: 30,
            bitrate: 1_000_000,
            keyFrameInterval: 30,
            chunkSize: 500,
          });
          setEncodedBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setShowVideoConfirm(true);
        } catch (e) {
          console.error("自動エンコード失敗:", e);
          toast("エラー", { description: "動画のエンコードに失敗しました" });
        }
      } else {
        console.warn("エンコード可能なフレームがありません");
        toast("警告", {
          description: "録画フレームがないため、動画は生成されませんでした",
        });
      }
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
      setTimerType("work");
      setTimeLeft(workDuration * 60);
      setTotalTime(workDuration * 60);
      setTimerState("idle");
      setSessionId(null); // 新しいセッションのため初期化
    }
  }, [
    timerType,
    workDuration,
    breakDuration,
    stopRecording,
    frames,
    encodeFrames,
    videoRef,
    captureFrame,
  ]);

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

  // タイマーのカウントダウン
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState === "running" && timerEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const secondsLeft = Math.max(
          0,
          Math.round((timerEndTime - now) / 1000)
        );
        setTimeLeft(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(interval);
          setTimerEndTime(null);
          handleTimerCompleted();
        }
      }, 250); // 250msごとにチェックして滑らかに
    }
    return () => {
      clearInterval(interval);
    };
  }, [timerState, timerEndTime, handleTimerCompleted]);

  // 録画中は1秒毎にvideoRefからフレームをキャプチャ
  // フレームキャプチャは useFrameCapture フック内で自動的に行われるようになったため、
  // 競合を避けるためこの useEffect は無効化
  /*
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRecording && videoRef.current) {
      console.log("フレームキャプチャ開始");
      // captureFrame を呼び出す前にログ出力
      console.log("videoRef.current の状態:", {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        readyState: videoRef.current.readyState,
      });

      intervalId = setInterval(() => {
        if (videoRef.current) {
          console.log("フレームをキャプチャします");
          captureFrame(videoRef.current);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        console.log("フレームキャプチャ停止");
        clearInterval(intervalId);
      }
    };
  }, [isRecording, videoRef, captureFrame]);
  */

  // 録画用に videoRef が変更されたら useFrameCapture に伝える
  useEffect(() => {
    if (videoRef.current && isRecording) {
      console.log("videoRef が変更されたため captureFrame を1回呼び出し");
      captureFrame(videoRef.current);
    }
  }, [videoRef, isRecording, captureFrame]);

  // タイマー実行中に定期的にフレームをキャプチャするための効果
  useEffect(() => {
    // タイマーが実行中かつ録画中の場合のみフレームをキャプチャする
    if (timerState === "running" && isRecording && videoRef.current) {
      console.log("タイマー実行中のフレームキャプチャを開始します");

      // 5秒ごとにフレームをキャプチャする
      const captureIntervalId = setInterval(() => {
        if (videoRef.current) {
          console.log(
            "タイマー実行中にフレームをキャプチャします",
            new Date().toISOString()
          );
          captureFrame(videoRef.current);
        }
      }, 5000); // 5秒間隔でキャプチャ（頻度を下げて安定性を確保）

      return () => {
        console.log("タイマー実行中のフレームキャプチャを停止します");
        clearInterval(captureIntervalId);
      };
    }
  }, [timerState, isRecording, videoRef, captureFrame]);

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

  // ページ離脱時、セッションが未作成（=pomoSession数0）の場合のみvisitを削除
  useEffect(() => {
    return () => {
      if (visitId && !sessionId && taskId) {
        fetch(`/api/tasks/${taskId}/visits/${visitId}`, { method: "DELETE" });
      }
    };
  }, [visitId, sessionId, taskId]);

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

              <div className="flex flex-col sm:flex-row items-center gap-4"></div>
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
          </CardContent>
        </Card>

        {/* カメラプレビュー */}
        <div className="my-6">
          <h3 className="font-bold mb-2">カメラプレビュー</h3>
          <video
            ref={videoRef}
            width={320}
            height={180}
            autoPlay
            muted
            className="rounded bg-black"
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {cameraError && <p className="text-red-500">{cameraError}</p>}
          {isRecording && <p className="text-red-500">録画中...</p>}
        </div>

        {/* タイマー終了後の動画確認・保存UI */}
        <Dialog
          open={showVideoConfirm}
          onOpenChange={(open) => {
            if (!open) {
              handleDiscardVideo();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>タイムラプス動画プレビュー</DialogTitle>
              <DialogDescription>
                録画した動画を確認し、保存または破棄できます。
              </DialogDescription>
            </DialogHeader>
            {/* エンコード中はスピナーと進捗 */}
            {encodingStatus?.isEncoding ? (
              <div className="flex items-center gap-2 mt-4">
                <Spinner />
                <span>エンコード中... {encodingStatus.progress}%</span>
                <div className="flex-1">
                  <Progress value={encodingStatus.progress} />
                </div>
              </div>
            ) : previewUrl ? (
              <video
                src={previewUrl}
                controls
                className="w-full max-w-md rounded my-4"
              />
            ) : (
              <p className="text-muted-foreground my-4">
                プレビューを生成できませんでした。
              </p>
            )}
            {encodingStatus?.error && (
              <p className="text-red-500 mt-2">{encodingStatus.error}</p>
            )}
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDiscardVideo}>
                破棄
              </Button>
              <Button
                onClick={handleSaveVideo}
                disabled={!encodedBlob || uploadStatus.isUploading}
              >
                {uploadStatus.isUploading
                  ? `アップロード中... ${uploadStatus.progress}%`
                  : "保存する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* アップロード進捗・完了表示 */}
        {uploadStatus.isUploading && (
          <div className="my-4">
            <p>アップロード中... {uploadStatus.progress}%</p>
            <Progress value={uploadStatus.progress} className="mt-1" />
          </div>
        )}
        {uploadStatus.downloadUrl && (
          <div className="my-4">
            <p className="text-green-600">アップロード完了！</p>
            <a
              href={uploadStatus.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              動画を表示
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const Spinner = () => (
  <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle mr-2" />
);
