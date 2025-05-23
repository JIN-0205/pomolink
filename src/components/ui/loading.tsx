"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "gradient" | "pulse";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const variantClasses = {
    default: "text-indigo-600",
    gradient:
      "text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text",
    pulse: "text-indigo-600 animate-pulse",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      />
      {text && <p className="text-sm text-gray-600 animate-fadeInUp">{text}</p>}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  animation?: "wave" | "pulse";
}

export function Skeleton({
  className,
  variant = "rectangular",
  animation = "pulse",
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const animationClasses = {
    wave: "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
    pulse: "animate-pulse bg-gray-200",
  };

  return (
    <div
      className={cn(
        "inline-block",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  variant?: "card" | "list" | "compact";
}

export function LoadingCard({
  title = "読み込み中...",
  description = "データを取得しています",
  variant = "card",
}: LoadingCardProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border animate-fadeInUp">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">{title}</span>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 animate-fadeInUp"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Skeleton variant="circular" className="h-10 w-10" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border shadow-sm animate-fadeInUp">
      <div className="flex items-center justify-center mb-4">
        <div className="p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-float">
          <LoadingSpinner size="lg" variant="gradient" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
