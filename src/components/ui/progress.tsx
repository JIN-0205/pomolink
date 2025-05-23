"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Pause, Play, Square } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-sub/20 relative h-2 w-full overflow-hidden rounded-full ",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-sub h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

interface ProgressBarProps {
  progress: number; // 0-100
  variant?: "default" | "gradient" | "pomodoro" | "break";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  variant = "default",
  size = "md",
  showPercentage = false,
  animated = true,
  className,
}: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variants = {
    default: "bg-gradient-to-r from-blue-500 to-blue-600",
    gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
    pomodoro: "bg-gradient-to-r from-red-500 to-orange-500",
    break: "bg-gradient-to-r from-green-500 to-emerald-500",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "bg-gray-200 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant],
            animated && "progress-bar"
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="absolute -top-6 right-0 text-xs font-medium text-gray-600">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "pomodoro" | "break" | "focus";
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  variant = "default",
  showPercentage = true,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const variants = {
    default: {
      bg: "stroke-gray-200",
      fg: "stroke-blue-500",
      gradient: "url(#gradient-default)",
    },
    pomodoro: {
      bg: "stroke-gray-200",
      fg: "stroke-red-500",
      gradient: "url(#gradient-pomodoro)",
    },
    break: {
      bg: "stroke-gray-200",
      fg: "stroke-green-500",
      gradient: "url(#gradient-break)",
    },
    focus: {
      bg: "stroke-gray-200",
      fg: "stroke-purple-500",
      gradient: "url(#gradient-focus)",
    },
  };

  const config = variants[variant];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90 animate-glow"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient
            id="gradient-default"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient
            id="gradient-pomodoro"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <linearGradient
            id="gradient-break"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient
            id="gradient-focus"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {/* 背景の円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={config.bg}
          fill="transparent"
        />

        {/* プログレス円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={config.gradient}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* 中央のコンテンツ */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ||
          (showPercentage && (
            <span className="text-xl font-bold text-gray-700">
              {Math.round(progress)}%
            </span>
          ))}
      </div>
    </div>
  );
}

interface TimerDisplayProps {
  timeLeft: number; // seconds
  totalTime: number; // seconds
  isRunning: boolean;
  variant?: "pomodoro" | "break" | "longBreak";
  size?: "sm" | "md" | "lg";
  onPlayPause?: () => void;
  onStop?: () => void;
}

export function TimerDisplay({
  timeLeft,
  totalTime,
  isRunning,
  variant = "pomodoro",
  size = "md",
  onPlayPause,
  onStop,
}: TimerDisplayProps) {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const sizes = {
    sm: { container: "w-32 h-32", text: "text-lg", icons: "h-4 w-4" },
    md: { container: "w-48 h-48", text: "text-2xl", icons: "h-5 w-5" },
    lg: { container: "w-64 h-64", text: "text-4xl", icons: "h-6 w-6" },
  };

  const variants = {
    pomodoro: {
      gradient: "pomodoro",
      bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
      title: "作業時間",
      color: "text-red-600",
    },
    break: {
      gradient: "break",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      title: "休憩時間",
      color: "text-green-600",
    },
    longBreak: {
      gradient: "break",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      title: "長い休憩",
      color: "text-blue-600",
    },
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  return (
    <div className={cn("relative", sizeConfig.container)}>
      <div
        className={cn(
          "absolute inset-0 rounded-full shadow-lg transition-all duration-300",
          variantConfig.bgColor,
          isRunning && "animate-timer-pulse"
        )}
      >
        <CircularProgress
          progress={progress}
          size={size === "sm" ? 128 : size === "md" ? 192 : 256}
          variant={
            variantConfig.gradient as "default" | "pomodoro" | "break" | "focus"
          }
          showPercentage={false}
        >
          <div className="text-center space-y-2">
            <div
              className={cn(
                "font-mono font-bold tracking-wider",
                sizeConfig.text,
                variantConfig.color
              )}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {variantConfig.title}
            </div>
            <div className="flex items-center justify-center space-x-2 mt-3">
              {onPlayPause && (
                <button
                  onClick={onPlayPause}
                  className={cn(
                    "p-2 rounded-full transition-all hover-lift btn-ripple",
                    "bg-white shadow-md hover:shadow-lg",
                    variantConfig.color
                  )}
                >
                  {isRunning ? (
                    <Pause className={sizeConfig.icons} />
                  ) : (
                    <Play className={sizeConfig.icons} />
                  )}
                </button>
              )}
              {onStop && (
                <button
                  onClick={onStop}
                  className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all hover-lift btn-ripple text-gray-600"
                >
                  <Square className={sizeConfig.icons} />
                </button>
              )}
            </div>
          </div>
        </CircularProgress>
      </div>

      {/* パルス効果 */}
      {isRunning && (
        <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" />
      )}
    </div>
  );
}

interface StepIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status: "pending" | "current" | "completed";
  }>;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "compact";
}

export function StepIndicator({
  steps,
  orientation = "horizontal",
  variant = "default",
}: StepIndicatorProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "items-center space-x-4" : "flex-col space-y-4"
      )}
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center",
            isHorizontal ? "flex-col text-center" : "flex-row space-x-3",
            variant === "compact" && "space-y-1"
          )}
        >
          {/* ステップアイコン */}
          <div className="relative">
            <div
              className={cn(
                "flex items-center justify-center rounded-full border-2 transition-all duration-300",
                step.status === "completed" &&
                  "bg-green-500 border-green-500 text-white animate-success-bounce",
                step.status === "current" &&
                  "bg-blue-500 border-blue-500 text-white animate-glow",
                step.status === "pending" &&
                  "bg-gray-100 border-gray-300 text-gray-500",
                variant === "compact" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
              )}
            >
              {step.status === "completed" ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>

            {/* 接続線 */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute transition-all duration-300",
                  isHorizontal
                    ? "top-1/2 left-full w-16 h-0.5 -translate-y-1/2"
                    : "top-full left-1/2 w-0.5 h-16 -translate-x-1/2",
                  steps[index + 1].status !== "pending"
                    ? "bg-green-500"
                    : "bg-gray-300"
                )}
              />
            )}
          </div>

          {/* ステップ情報 */}
          {variant !== "compact" && (
            <div className={cn(isHorizontal ? "mt-2" : "")}>
              <h3
                className={cn(
                  "font-medium transition-colors",
                  step.status === "current" && "text-blue-600",
                  step.status === "completed" && "text-green-600",
                  step.status === "pending" && "text-gray-500"
                )}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="text-sm text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
