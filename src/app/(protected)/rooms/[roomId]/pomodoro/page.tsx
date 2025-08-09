"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { SubscriptionLimitModal } from "@/components/subscription/SubscriptionLimitModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import TimerControls from "@/components/pomodoro/TimeControls";
import {
  formatTime,
  playNotificationSound,
  sendNotification,
} from "@/lib/utils";
import { Task } from "@/types";

import EnhancedTimerDisplay from "@/components/pomodoro/EnhancedTimerDisplay";
import TaskSummary from "@/components/pomodoro/TaskSummary";
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
import { AlarmPreset } from "@/lib/audio";
import { PlanType } from "@prisma/client";

type TimerType = "work" | "break";

type TimerState = "idle" | "running" | "paused" | "completed";

export default function PomodoroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(!!taskId);
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [userSettings, setUserSettings] = useState({
    workAlarmSound: "buzzer" as AlarmPreset,
    breakAlarmSound: "kalimba" as AlarmPreset,
    soundVolume: 0.5,
  });

  const workDuration = task?.workDuration || 25;
  const breakDuration = task?.breakDuration || 5;

  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [totalTime, setTotalTime] = useState(workDuration * 60);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const { videoRef, error: cameraError } = useCamera({
    width: 640,
    height: 360,
    enabled: isCameraEnabled,
  });
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
    interval: 833,
  });
  const { encodingStatus, encodeFrames, resetStatus } = useVideoEncoder();
  const { uploadStatus, uploadVideo, resetUploadStatus } = useVideoUpload();
  const [encodedBlob, setEncodedBlob] = useState<Blob | null>(null);
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<{
    currentCount: number;
    maxCount: number;
    planType: PlanType;
    error: string;
    roomOwnerName?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const res = await fetch("/api/users/settings");
        if (res.ok) {
          const settings = await res.json();
          setUserSettings(settings);
        }
      } catch (error) {
        console.error("Failed to fetch user settings:", error);
      }
    };
    fetchUserSettings();
  }, []);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setTask(null);
            return;
          }
          throw new Error("タスクの取得に失敗しました");
        }
        const data = await res.json();
        setTask(data.task || data);
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

  const startTimer = async () => {
    if (timerState === "running") return;

    if (timerState === "idle" && timerType === "work") {
      if (taskId) {
        try {
          const res = await fetch(`/api/pomodoro/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId,
              withRecording: isCameraEnabled,
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error("Session create API error:", res.status, errText);

            if (res.status === 403 && isCameraEnabled) {
              try {
                const errorData = JSON.parse(errText);
                if (errorData.code === "RECORDING_LIMIT_EXCEEDED") {
                  setLimitError({
                    currentCount: errorData.currentCount,
                    maxCount: errorData.maxCount,
                    planType: errorData.planType,
                    error: errorData.error,
                    roomOwnerName: errorData.roomOwnerName,
                  });
                  setShowLimitModal(true);
                  return;
                }
              } catch (parseError) {
                console.error(
                  "Error parsing session creation error:",
                  parseError
                );
              }
            }

            if (res.status === 403 && !isCameraEnabled) {
              try {
                const errorData = JSON.parse(errText);
                if (errorData.code === "RECORDING_LIMIT_EXCEEDED") {
                  console.log(
                    "カメラオフでの録画制限エラー - 録画なしで再試行"
                  );
                  toast("録画なしでセッションを開始します", {
                    description: "カメラがオフのため録画は行われません。",
                  });

                  const retryRes = await fetch(`/api/pomodoro/sessions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      taskId,
                      withRecording: false,
                    }),
                  });

                  if (retryRes.ok) {
                    const retryData = await retryRes.json();
                    setSessionId(retryData.id);
                    updateTaskStatus("IN_PROGRESS");
                  } else {
                    throw new Error("録画なしセッション作成失敗");
                  }
                } else {
                  throw new Error("セッション作成失敗");
                }
              } catch (parseError) {
                console.error("Error parsing error response:", parseError);
                throw new Error("セッション作成失敗");
              }
            } else {
              throw new Error("セッション作成失敗");
            }
          } else {
            const data = await res.json();
            setSessionId(data.id);
            updateTaskStatus("IN_PROGRESS");
          }
        } catch (error) {
          console.error(error);

          if (!isCameraEnabled && !sessionId) {
            try {
              const retryRes = await fetch(`/api/pomodoro/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  taskId,
                  withRecording: false,
                }),
              });

              if (retryRes.ok) {
                const retryData = await retryRes.json();
                setSessionId(retryData.id);
                updateTaskStatus("IN_PROGRESS");
                toast("録画なしでセッションを開始しました", {
                  description: "カメラがオフのため録画は行われません。",
                });
              } else {
                toast("録画なしでタイマーを開始します", {
                  description:
                    "セッション記録はありませんが、タイマーは利用できます。",
                });
              }
            } catch (retryError) {
              console.error("Retry session creation failed:", retryError);
              toast("録画なしでタイマーを開始します", {
                description:
                  "セッション記録はありませんが、タイマーは利用できます。",
              });
            }
          } else if (isCameraEnabled) {
            toast("エラー", { description: "セッションの開始に失敗しました" });
            return;
          }
        }
      }

      if (isCameraEnabled) {
        clearFrames();
        setEncodedBlob(null);
        setPreviewUrl(null);
        resetStatus();
        resetUploadStatus();

        startRecording();
      }
    }

    const durationMs = timeLeft * 1000;
    setTimerEndTime(Date.now() + durationMs);
    setTimerState("running");
  };

  const pauseTimer = () => {
    if (timerState !== "running") return;
    setTimerState("paused");
    setTimerEndTime(null);
  };

  const skipTimer = () => {
    if (timerState !== "running" && timerState !== "paused") return;
    setTimerEndTime(null);
    handleTimerSkipped();
  };

  const handleTimerSkipped = useCallback(async () => {
    setTimerEndTime(null);

    if (timerType === "work") {
      if (isCameraEnabled) {
        stopRecording();
        clearFrames();

        if (encodedBlob) {
          setEncodedBlob(null);
        }
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        resetStatus();
      }

      if (sessionId) {
        try {
          await fetch(`/api/pomodoro/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endTime: new Date().toISOString(),
              completed: false,
              skipped: true,
            }),
          });
        } catch (error) {
          console.error("セッション更新エラー:", error);
        }
      }

      toast("作業タイマーをスキップしました", {
        description: "録画は破棄され、完了ポモドーロはカウントされません。",
      });

      setTimerType("break");
      setTimeLeft(breakDuration * 60);
      setTotalTime(breakDuration * 60);
      setTimerState("idle");
      setSessionId(undefined);
    } else {
      toast("休憩をスキップしました", {
        description: "次の作業を開始しましょう！",
      });

      setTimerType("work");
      setTimeLeft(workDuration * 60);
      setTotalTime(workDuration * 60);
      setTimerState("idle");
      setSessionId(undefined);
    }
  }, [
    timerType,
    workDuration,
    breakDuration,
    isCameraEnabled,
    stopRecording,
    clearFrames,
    encodedBlob,
    previewUrl,
    resetStatus,
    sessionId,
  ]);
  const handleSaveVideo = useCallback(async () => {
    if (!encodedBlob || !sessionId) return;
    try {
      const limitCheckResponse = await fetch(`/api/recording-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
        }),
      });

      if (!limitCheckResponse.ok) {
        const error = await limitCheckResponse.json();
        if (error.code === "RECORDING_LIMIT_EXCEEDED") {
          setLimitError({
            currentCount: error.currentCount,
            maxCount: error.maxCount,
            planType: error.planType,
            error: error.error,
            roomOwnerName: error.roomOwnerName,
          });
          setShowLimitModal(true);
          return;
        }
        throw new Error("録画制限チェックに失敗しました");
      }

      const downloadUrl = await uploadVideo(
        encodedBlob,
        `timelapse/pomodoro-${sessionId}-${Date.now()}.mp4`
      );

      await fetch(`/api/pomodoro/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordingUrl: downloadUrl,
          recordingDuration: Math.round(workDuration * 60),
          endTime: new Date().toISOString(),
          completed: true,
        }),
      });
      toast("動画を保存しました");
    } catch (error) {
      console.error("保存中にエラー:", error);
      toast("エラー", { description: "動画の保存に失敗しました" });
    } finally {
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
    workDuration,
  ]);

  const handleDiscardVideo = useCallback(async () => {
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

  const handleTimerCompleted = useCallback(async () => {
    setTimerEndTime(null);
    if (timerType === "work") {
      if (isCameraEnabled) {
        stopRecording();

        if (videoRef.current) {
          captureFrame(videoRef.current);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log(`キャプチャしたフレーム: ${frames.length}枚`);

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
        if (sessionId) {
          try {
            await fetch(`/api/pomodoro/sessions/${sessionId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endTime: new Date().toISOString(),
                completed: true,
                recordingDuration: Math.round(workDuration * 60),
              }),
            });
          } catch (error) {
            console.error("セッション更新エラー:", error);
          }
        }
      }

      sendNotification("ポモドーロ完了", {
        body: "お疲れさまでした！休憩時間です。",
        icon: "/favicon.ico",
      });
      toast("ポモドーロ完了", {
        description: "お疲れさまでした！休憩時間です。",
      });
      setIsCameraEnabled(true);
      setTimerType("break");
      setTimeLeft(breakDuration * 60);
      setTotalTime(breakDuration * 60);
      setTimerState("idle");

      if (task && taskId) {
        try {
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              completedPomos: (task.completedPomos ?? 0) + 1,
            }),
          });
          if (res.ok) {
            const updatedTask = await res.json();
            setTask(updatedTask);
          }
        } catch (e) {
          console.error("completedPomos更新失敗", e);
        }
      }
    } else {
      playNotificationSound();
      sendNotification("休憩完了", {
        body: "次のポモドーロを開始しましょう！",
        icon: "/favicon.ico",
      });
      toast("休憩完了", {
        description: "次のポモドーロを開始しましょう！",
      });
      setIsCameraEnabled(true);
      setTimerType("work");
      setTimeLeft(workDuration * 60);
      setTotalTime(workDuration * 60);
      setTimerState("idle");
      setSessionId(undefined);
    }
  }, [
    timerType,
    workDuration,
    breakDuration,
    isCameraEnabled,
    stopRecording,
    frames,
    encodeFrames,
    videoRef,
    captureFrame,
    task,
    taskId,
    sessionId,
  ]);

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
      }, 250);
    }
    return () => {
      clearInterval(interval);
    };
  }, [timerState, timerEndTime, handleTimerCompleted]);

  useEffect(() => {
    if (videoRef.current && isRecording) {
      captureFrame(videoRef.current);
    }
  }, [videoRef, isRecording, captureFrame]);

  useEffect(() => {
    if (
      timerState === "running" &&
      isRecording &&
      isCameraEnabled &&
      videoRef.current
    ) {
      const captureIntervalId = setInterval(() => {
        if (videoRef.current) {
          captureFrame(videoRef.current);
        }
      }, 1000);

      return () => {
        clearInterval(captureIntervalId);
      };
    }
  }, [timerState, isRecording, isCameraEnabled, videoRef, captureFrame]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timerState === "running" || timerState === "paused") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [timerState]);

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const handleCloseLimitModal = () => {
    setShowLimitModal(false);
    setLimitError(null);
  };

  return (
    <div className="container py-4 sm:py-6 max-w-3xl px-4 sm:px-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 sm:mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <div className="grid gap-4 sm:gap-6">
        {!isLoading && task && <TaskSummary task={task} />}

        <Card className="overflow-hidden">
          <CardContent className="px-4 sm:px-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              ポモドーロ設定
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {workDuration}分
                </div>
                <div className="text-xs sm:text-sm text-blue-800">作業時間</div>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {breakDuration}分
                </div>
                <div className="text-xs sm:text-sm text-green-800">
                  休憩時間
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 text-center">
              時間はプランナーによって設定されています。
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
          <div className="w-full max-w-sm">
            <EnhancedTimerDisplay
              timeLeft={timeLeft}
              totalTime={totalTime}
              timerType={timerType}
              timerState={timerState}
              currentCycle={(task?.completedPomos ?? 0) + 1}
              totalCycles={task?.estimatedPomos ?? 4}
              formatTime={formatTime}
              workAlarmSound={userSettings.workAlarmSound}
              breakAlarmSound={userSettings.breakAlarmSound}
              soundVolume={userSettings.soundVolume}
            />
          </div>

          <TimerControls
            timerState={timerState}
            onStart={startTimer}
            onPause={pauseTimer}
            onSkip={skipTimer}
            timerType={timerType}
          />
        </div>
        <Card className="overflow-hidden">
          <CardContent className=" sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 ">
              <h3 className="font-bold text-sm sm:text-base">カメラ設定</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  カメラ
                </span>
                <Button
                  variant={isCameraEnabled ? "main" : "outline"}
                  size="sm"
                  onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                  className="px-3 py-1 text-xs sm:text-sm"
                >
                  {isCameraEnabled ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            {isCameraEnabled ? (
              <div className="flex flex-col items-center">
                <video
                  ref={videoRef}
                  className="w-full max-w-[320px] h-auto aspect-video rounded bg-black"
                  autoPlay
                  muted
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {cameraError && (
                  <p className="text-red-500 text-xs sm:text-sm mt-2 text-center">
                    {cameraError}
                  </p>
                )}
                {isRecording && (
                  <p className="text-red-500 text-xs sm:text-sm mt-2 text-center">
                    📹 録画中...
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded flex items-center justify-center aspect-video w-full max-w-[320px] mx-auto">
                <div className="text-center text-gray-500">
                  <div className="text-2xl sm:text-4xl mb-2">📹</div>
                  <div className="text-xs sm:text-sm">カメラがオフです</div>
                  <div className="text-xs">録画は行われません</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              <Button variant="sub" onClick={handleDiscardVideo}>
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

        {limitError && (
          <SubscriptionLimitModal
            isOpen={showLimitModal}
            onClose={handleCloseLimitModal}
            limitType="RECORDING"
            currentPlan={limitError.planType}
            currentCount={limitError.currentCount}
            maxCount={limitError.maxCount}
            onUpgrade={handleUpgrade}
            customMessage={limitError.error}
            recordingLimitType="ROOM"
            userRole="PERFORMER"
            roomOwnerName={limitError.roomOwnerName}
          />
        )}
      </div>
    </div>
  );
}

const Spinner = () => (
  <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle mr-2" />
);
