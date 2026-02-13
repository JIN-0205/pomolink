import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { playTimerSound, type AlarmPreset } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { Coffee, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

interface EnhancedTimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  timerType: "work" | "break";
  timerState: "idle" | "running" | "paused" | "completed";
  currentCycle?: number;
  totalCycles?: number;
  formatTime: (seconds: number) => string;
  workAlarmSound?: AlarmPreset;
  breakAlarmSound?: AlarmPreset;
  soundVolume?: number;
}

export default function EnhancedTimerDisplay({
  timeLeft,
  totalTime,
  timerType,
  timerState,
  currentCycle = 1,
  totalCycles = 4,
  formatTime,
  workAlarmSound = "buzzer",
  breakAlarmSound = "levelup",
  soundVolume = 0.5,
}: EnhancedTimerDisplayProps) {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const isWorkTimer = timerType === "work";
  const prevTimeLeftRef = useRef(timeLeft);

  // タイマー終了を検知して効果音を再生
  const prevTimerStateRef = useRef(timerState);
  const prevTimerTypeRef = useRef(timerType);

  // アラーム再生フラグを追加（同じタイマー終了で複数回鳴らないため）
  const alarmPlayedRef = useRef(false);

  useEffect(() => {
    // console.log("Timer effect triggered:", {
    //   prevTimeLeft: prevTimeLeftRef.current,
    //   currentTimeLeft: timeLeft,
    //   prevTimerState: prevTimerStateRef.current,
    //   currentTimerState: timerState,
    //   prevTimerType: prevTimerTypeRef.current,
    //   currentTimerType: timerType,
    //   workAlarmSound,
    //   breakAlarmSound,
    //   alarmPlayed: alarmPlayedRef.current,
    // });

    // 新しいタイマーが開始された場合（timeLeftが大幅に増加）、アラームフラグをリセット
    if (timeLeft > prevTimeLeftRef.current + 10) {
      // console.log("New timer started, resetting alarm flag");
      alarmPlayedRef.current = false;
    }

    // アラームが既に再生されている場合は早期リターン
    if (alarmPlayedRef.current) {
      // console.log("Alarm already played, skipping");
      prevTimeLeftRef.current = timeLeft;
      prevTimerStateRef.current = timerState;
      prevTimerTypeRef.current = timerType;
      return;
    }

    // タイマー終了の検知（優先度順で評価し、最初にマッチしたもののみ実行）
    let timerFinished = false;
    let endedTimerType: "work" | "break" | null = null;
    let detectionPattern = "";

    // パターン1（最優先）: timeLeftが1以上から0になった場合（確実な終了検知）
    if (
      prevTimeLeftRef.current > 0 &&
      timeLeft === 0 &&
      timerState === "running"
    ) {
      timerFinished = true;
      endedTimerType = prevTimerTypeRef.current;
      detectionPattern = "timeLeft_to_zero";
    }
    // パターン2: timerStateがrunningからcompletedに変わった場合
    else if (
      prevTimerStateRef.current === "running" &&
      timerState === "completed"
    ) {
      timerFinished = true;
      endedTimerType = prevTimerTypeRef.current;
      detectionPattern = "state_to_completed";
    }
    // パターン3: timerTypeが切り替わった場合（タイマー終了により次のタイマーへ）
    else if (
      prevTimerTypeRef.current !== timerType &&
      prevTimerStateRef.current === "running" &&
      prevTimeLeftRef.current <= 3
    ) {
      timerFinished = true;
      endedTimerType = prevTimerTypeRef.current;
      detectionPattern = "timer_type_change";
    }

    if (timerFinished && endedTimerType) {
      const alarmSound =
        endedTimerType === "work" ? workAlarmSound : breakAlarmSound;

      console.log("Timer finished:", {
        detectionPattern,
        currentTimerType: timerType,
        prevTimerType: prevTimerTypeRef.current,
        endedTimerType,
        isWorkTimer: endedTimerType === "work",
        workAlarmSound,
        breakAlarmSound,
        selectedAlarmSound: alarmSound,
        prevTimeLeft: prevTimeLeftRef.current,
        currentTimeLeft: timeLeft,
        prevTimerState: prevTimerStateRef.current,
        currentTimerState: timerState,
      });

      // アラームを再生し、フラグを設定
      playTimerSound(endedTimerType, alarmSound, soundVolume);
      alarmPlayedRef.current = true;
    }

    prevTimeLeftRef.current = timeLeft;
    prevTimerStateRef.current = timerState;
    prevTimerTypeRef.current = timerType;
  }, [
    timeLeft,
    timerState,
    timerType,
    workAlarmSound,
    breakAlarmSound,
    soundVolume,
  ]);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 shadow-2xl transition-all duration-500 w-full",
        isWorkTimer
          ? "bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 dark:from-indigo-950/20 dark:via-indigo-900/30 dark:to-indigo-800/40"
          : "bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950/20 dark:via-green-900/30 dark:to-green-800/40",
        timerState === "running" && timeLeft < 11 && "animate-timer-pulse",
      )}
    >
      {/* 背景パターン */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full animate-[shimmer_3s_infinite]" />
      </div>

      <CardContent className="relative py-2 text-center">
        {/* タイマータイプバッジ */}
        <div className="flex justify-center mb-4 sm:mb-6 ">
          <Badge
            variant="secondary"
            className={cn(
              "px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold",
              isWorkTimer
                ? "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200"
                : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200",
            )}
          >
            {isWorkTimer ? (
              <>
                <Zap className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                集中時間
              </>
            ) : (
              <>
                <Coffee className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                休憩時間
              </>
            )}
          </Badge>
        </div>

        {/* メインタイマー表示 */}
        <div className="relative mb-6 sm:mb-8">
          {/* 円形プログレスの背景 */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* 背景円 */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* プログレス円 */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  isWorkTimer
                    ? "text-indigo-500 dark:text-indigo-400"
                    : "text-green-500 dark:text-green-400",
                )}
                strokeLinecap="round"
              />
            </svg>

            {/* 中央のタイマー表示 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={cn(
                  "text-3xl sm:text-4xl lg:text-5xl font-mono font-bold",
                  isWorkTimer
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-green-700 dark:text-green-300",
                )}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
        {/* サイクル情報 */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalCycles }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300",
                  i < currentCycle - 1
                    ? isWorkTimer
                      ? "bg-indigo-500"
                      : "bg-green-500"
                    : i === currentCycle - 1
                      ? isWorkTimer
                        ? "bg-indigo-300 ring-2 ring-indigo-500"
                        : "bg-green-300 ring-2 ring-green-500"
                      : "bg-gray-200 dark:bg-gray-600",
                )}
              />
            ))}
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground">
            サイクル {currentCycle} / {totalCycles}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
