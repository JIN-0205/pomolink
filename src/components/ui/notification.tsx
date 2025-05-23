"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, Bell, CheckCircle, Info, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface NotificationProps {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export function Notification({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  persistent = false,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, persistent, handleClose]);

  if (!isVisible) return null;

  const variants = {
    success: {
      bg: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
      icon: CheckCircle,
      iconColor: "text-green-600",
      titleColor: "text-green-800",
      messageColor: "text-green-700",
    },
    error: {
      bg: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200",
      icon: AlertCircle,
      iconColor: "text-red-600",
      titleColor: "text-red-800",
      messageColor: "text-red-700",
    },
    warning: {
      bg: "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200",
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-800",
      messageColor: "text-yellow-700",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
      icon: Info,
      iconColor: "text-blue-600",
      titleColor: "text-blue-800",
      messageColor: "text-blue-700",
    },
  };

  const config = variants[type];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300",
        config.bg,
        isExiting ? "animate-slideOut" : "animate-slideIn",
        "hover-lift"
      )}
    >
      {/* アイコン */}
      <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
        <IconComponent className="h-5 w-5" />
      </div>

      {/* コンテンツ */}
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-semibold", config.titleColor)}>
          {title}
        </h4>
        {message && (
          <p className={cn("text-sm mt-1", config.messageColor)}>{message}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              "mt-2 text-xs font-medium underline transition-colors hover-lift",
              config.titleColor
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* 閉じるボタン */}
      <button
        onClick={handleClose}
        className={cn(
          "flex-shrink-0 p-1 rounded-md transition-colors hover-lift btn-ripple",
          config.iconColor,
          "hover:bg-white/50"
        )}
      >
        <X className="h-4 w-4" />
      </button>

      {/* プログレスバー（期間表示） */}
      {!persistent && duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg animate-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

interface ToastProps {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  onRemove: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center";
}

export function Toast({
  notifications,
  onRemove,
  position = "top-right",
}: ToastProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div className={cn("fixed z-50 space-y-2", positionClasses[position])}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          action={notification.action}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

interface StatusIndicatorProps {
  status: "online" | "offline" | "away" | "busy";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = "md",
  showLabel = false,
  label,
  animated = false,
  className,
}: StatusIndicatorProps) {
  const sizes = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const variants = {
    online: {
      bg: "bg-green-500",
      label: "オンライン",
      ring: "ring-green-500/30",
    },
    offline: {
      bg: "bg-gray-400",
      label: "オフライン",
      ring: "ring-gray-400/30",
    },
    away: {
      bg: "bg-yellow-500",
      label: "離席中",
      ring: "ring-yellow-500/30",
    },
    busy: {
      bg: "bg-red-500",
      label: "取り込み中",
      ring: "ring-red-500/30",
    },
  };

  const config = variants[status];
  const displayLabel = label || config.label;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizes[size],
            config.bg,
            animated && status === "online" && "animate-pulse"
          )}
        />
        {animated && status === "online" && (
          <div
            className={cn(
              "absolute inset-0 rounded-full ring-2 animate-ping",
              config.ring
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600">
          {displayLabel}
        </span>
      )}
    </div>
  );
}

interface PomodoroNotificationProps {
  type:
    | "work-start"
    | "work-complete"
    | "break-start"
    | "break-complete"
    | "session-complete";
  cycle?: number;
  totalCycles?: number;
  onDismiss?: () => void;
}

export function PomodoroNotification({
  type,
  cycle,
  totalCycles,
  onDismiss,
}: PomodoroNotificationProps) {
  const configs = {
    "work-start": {
      title: "作業開始！",
      message: "集中して取り組みましょう 🚀",
      icon: Zap,
      type: "info" as const,
      emoji: "💪",
    },
    "work-complete": {
      title: "作業完了！",
      message: `サイクル ${cycle}/${totalCycles} が完了しました`,
      icon: CheckCircle,
      type: "success" as const,
      emoji: "🎉",
    },
    "break-start": {
      title: "休憩時間",
      message: "少し休憩して、リフレッシュしましょう ☕",
      icon: Info,
      type: "info" as const,
      emoji: "😌",
    },
    "break-complete": {
      title: "休憩完了",
      message: "次の作業サイクルの準備ができました",
      icon: Bell,
      type: "warning" as const,
      emoji: "⚡",
    },
    "session-complete": {
      title: "セッション完了！",
      message: `${totalCycles}サイクル全て完了しました。お疲れさまでした！`,
      icon: CheckCircle,
      type: "success" as const,
      emoji: "🏆",
    },
  };

  const config = configs[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-sm">
        <div className="flex items-start gap-4">
          <div className="text-3xl animate-bounce">{config.emoji}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{config.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{config.message}</p>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors hover-lift"
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
