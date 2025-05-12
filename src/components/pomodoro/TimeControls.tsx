import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward } from "lucide-react";

type TimerState = "idle" | "running" | "paused" | "completed";

interface TimerControlsProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
}

const TimerControls = ({
  timerState,
  onStart,
  onPause,
  onSkip,
}: TimerControlsProps) => {
  return (
    <div className="flex gap-2">
      {timerState === "idle" || timerState === "paused" ? (
        <Button onClick={onStart} size="lg">
          <Play className="mr-2 h-4 w-4" />
          開始
        </Button>
      ) : (
        <Button
          onClick={onPause}
          size="lg"
          variant="sub"
          className="font-medium"
        >
          <Pause className="mr-2 h-4 w-4" />
          一時停止
        </Button>
      )}

      <Button
        onClick={onSkip}
        size="lg"
        variant="sub"
        className="font-medium"
        disabled={timerState === "idle" || timerState === "completed"}
      >
        <SkipForward className="mr-2 h-4 w-4" />
        スキップ
      </Button>
    </div>
  );
};

export default TimerControls;
