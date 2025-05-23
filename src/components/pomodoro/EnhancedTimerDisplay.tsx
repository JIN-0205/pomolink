import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Target, Zap } from "lucide-react";

interface EnhancedTimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  timerType: "work" | "break";
  timerState: "idle" | "running" | "paused" | "completed";
  currentCycle?: number;
  totalCycles?: number;
  formatTime: (seconds: number) => string;
}

export default function EnhancedTimerDisplay({
  timeLeft,
  totalTime,
  timerType,
  timerState,
  currentCycle = 1,
  totalCycles = 4,
  formatTime,
}: EnhancedTimerDisplayProps) {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const isWorkTimer = timerType === "work";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 shadow-2xl transition-all duration-500",
        isWorkTimer
          ? "bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 dark:from-indigo-950/20 dark:via-indigo-900/30 dark:to-indigo-800/40"
          : "bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950/20 dark:via-green-900/30 dark:to-green-800/40",
        timerState === "running" && timeLeft < 11 && "animate-timer-pulse"
      )}
    >
      {/* 背景パターン */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full animate-[shimmer_3s_infinite]" />
      </div>

      <CardContent className="relative p-8 text-center">
        {/* タイマータイプバッジ */}
        <div className="flex justify-center mb-6">
          <Badge
            variant="secondary"
            className={cn(
              "px-4 py-2 text-sm font-semibold",
              isWorkTimer
                ? "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200"
                : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200"
            )}
          >
            {isWorkTimer ? (
              <>
                <Zap className="mr-2 h-4 w-4" />
                集中時間
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                休憩時間
              </>
            )}
          </Badge>
        </div>

        {/* メインタイマー表示 */}
        <div className="relative mb-8">
          {/* 円形プログレスの背景 */}
          <div className="relative w-64 h-64 mx-auto">
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
                    : "text-green-500 dark:text-green-400"
                )}
                strokeLinecap="round"
              />
            </svg>

            {/* 中央のタイマー表示 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={cn(
                  "text-5xl font-mono font-bold",
                  isWorkTimer
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-green-700 dark:text-green-300"
                )}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* サイクル情報 */}
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalCycles }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  i < currentCycle - 1
                    ? isWorkTimer
                      ? "bg-indigo-500"
                      : "bg-green-500"
                    : i === currentCycle - 1
                      ? isWorkTimer
                        ? "bg-indigo-300 ring-2 ring-indigo-500"
                        : "bg-green-300 ring-2 ring-green-500"
                      : "bg-gray-200 dark:bg-gray-600"
                )}
              />
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            サイクル {currentCycle} / {totalCycles}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
