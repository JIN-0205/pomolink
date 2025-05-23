import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

type TimerState = "idle" | "running" | "paused" | "completed";

interface TimerControlsProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReset?: () => void;
  timerType?: "work" | "break";
}

const TimerControls = ({
  timerState,
  onStart,
  onPause,
  onSkip,
  onReset,
  timerType = "work",
}: TimerControlsProps) => {
  const isWorkTimer = timerType === "work";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* メインコントロール */}
      <div className="flex gap-4">
        {timerState === "idle" || timerState === "paused" ? (
          <Button
            onClick={onStart}
            size="lg"
            className={cn(
              "h-14 px-8 text-lg font-semibold shadow-lg hover-lift",
              isWorkTimer
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            )}
          >
            <Play className="mr-3 h-5 w-5" />
            {timerState === "paused" ? "再開" : "開始"}
          </Button>
        ) : (
          <Button
            onClick={onPause}
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg font-semibold border-2 hover-lift"
          >
            <Pause className="mr-3 h-5 w-5" />
            一時停止
          </Button>
        )}

        <Button
          onClick={onSkip}
          size="lg"
          variant="outline"
          className="h-14 px-6 text-lg font-semibold border-2 hover-lift"
          disabled={timerState === "idle" || timerState === "completed"}
        >
          <SkipForward className="mr-2 h-5 w-5" />
          スキップ
        </Button>
      </div>

      {/* サブコントロール */}
      <div className="flex gap-2">
        {onReset && (
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            disabled={timerState === "running"}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            リセット
          </Button>
        )}
      </div>

      {/* タイマー状態インジケーター */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            timerState === "running"
              ? isWorkTimer
                ? "bg-red-500 animate-pulse"
                : "bg-green-500 animate-pulse"
              : timerState === "paused"
                ? "bg-yellow-500"
                : "bg-gray-300"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {timerState === "running"
            ? isWorkTimer
              ? "集中中"
              : "休憩中"
            : timerState === "paused"
              ? "一時停止"
              : "待機中"}
        </span>
      </div>
    </div>
  );
};

export default TimerControls;
