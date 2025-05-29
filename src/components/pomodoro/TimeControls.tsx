import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
      {/* メインコントロール */}
      <div className="flex gap-3 sm:gap-4 w-full max-w-sm justify-center">
        {timerState === "idle" || timerState === "paused" ? (
          <Button
            onClick={onStart}
            size="lg"
            className={cn(
              "h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold shadow-lg hover-lift flex-1 sm:flex-initial",
              isWorkTimer
                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            )}
          >
            <Play className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
            {timerState === "paused" ? "再開" : "開始"}
          </Button>
        ) : (
          <Button
            onClick={onPause}
            size="lg"
            variant="outline"
            className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold border-2 hover-lift flex-1 sm:flex-initial"
          >
            <Pause className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
            一時停止
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="h-12 sm:h-14 px-4 sm:px-6 text-base sm:text-lg font-semibold border-2 hover-lift"
              disabled={timerState === "idle" || timerState === "completed"}
            >
              <SkipForward className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">スキップ</span>
              <span className="sm:hidden">Skip</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isWorkTimer
                  ? "作業タイマーをスキップしますか？"
                  : "休憩タイマーをスキップしますか？"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isWorkTimer ? (
                  <>
                    スキップすると録画は破棄され、完了ポモドーロもカウントされません。
                    <br />
                    本当にスキップしますか？
                  </>
                ) : (
                  "休憩をスキップして次の作業に進みますか？"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={onSkip}>スキップ</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* サブコントロール */}
      {onReset && (
        <div className="flex gap-2">
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-xs sm:text-sm"
            disabled={timerState === "running"}
          >
            <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            リセット
          </Button>
        </div>
      )}
    </div>
  );
};

export default TimerControls;
