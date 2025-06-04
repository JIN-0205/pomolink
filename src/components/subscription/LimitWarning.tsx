"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getPlanName, PLAN_LIMITS } from "@/lib/subscription-limits";
import { PlanType } from "@prisma/client";
import { AlertTriangle, Users, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UpgradeDialog } from "./UpgradeDialog";

interface LimitWarningProps {
  planType: PlanType;
  dailyRecordingCount: number;
  currentParticipants?: number;
  roomId?: string;
}

export function LimitWarning({
  planType,
  dailyRecordingCount,
  currentParticipants = 0,
  roomId,
}: LimitWarningProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeType, setUpgradeType] = useState<"recording" | "participants">(
    "recording"
  );

  const limits = PLAN_LIMITS[planType];
  const recordingUsagePercent =
    (dailyRecordingCount / limits.maxDailyRecordings) * 100;
  const participantUsagePercent =
    currentParticipants > 0
      ? (currentParticipants / limits.maxParticipants) * 100
      : 0;

  const isRecordingLimitReached =
    dailyRecordingCount >= limits.maxDailyRecordings;
  const isParticipantLimitReached =
    currentParticipants >= limits.maxParticipants;
  const isRecordingNearLimit = recordingUsagePercent >= 80;
  const isParticipantNearLimit = participantUsagePercent >= 80;

  const handleUpgradeClick = (type: "recording" | "participants") => {
    setUpgradeType(type);
    setShowUpgradeDialog(true);
  };

  // 制限に達している場合の警告
  if (isRecordingLimitReached || isParticipantLimitReached) {
    return (
      <>
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="space-y-2">
              {isRecordingLimitReached && (
                <p>
                  <strong>録画制限に達しました:</strong> 本日の録画回数が上限（
                  {limits.maxDailyRecordings}件）に達しています。
                </p>
              )}
              {isParticipantLimitReached && (
                <p>
                  <strong>参加者制限に達しました:</strong>{" "}
                  このルームの参加者数が上限（{limits.maxParticipants}
                  人）に達しています。
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() =>
                    handleUpgradeClick(
                      isRecordingLimitReached ? "recording" : "participants"
                    )
                  }
                >
                  プランをアップグレード
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/pricing">料金プランを見る</Link>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentPlan={planType}
          limitType={upgradeType}
          currentCount={
            upgradeType === "recording"
              ? dailyRecordingCount
              : currentParticipants
          }
          maxCount={
            upgradeType === "recording"
              ? limits.maxDailyRecordings
              : limits.maxParticipants
          }
        />
      </>
    );
  }

  // 制限に近づいている場合の警告
  if (isRecordingNearLimit || isParticipantNearLimit) {
    return (
      <>
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="space-y-3">
              <p>
                <strong>{getPlanName(planType)}プラン</strong>{" "}
                の制限に近づいています
              </p>

              {isRecordingNearLimit && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      録画回数
                    </span>
                    <span>
                      {dailyRecordingCount}/{limits.maxDailyRecordings}
                    </span>
                  </div>
                  <Progress value={recordingUsagePercent} className="h-2" />
                </div>
              )}

              {isParticipantNearLimit && roomId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      参加者数
                    </span>
                    <span>
                      {currentParticipants}/{limits.maxParticipants}
                    </span>
                  </div>
                  <Progress value={participantUsagePercent} className="h-2" />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleUpgradeClick(
                      isRecordingNearLimit ? "recording" : "participants"
                    )
                  }
                >
                  プランを確認
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentPlan={planType}
          limitType={upgradeType}
          currentCount={
            upgradeType === "recording"
              ? dailyRecordingCount
              : currentParticipants
          }
          maxCount={
            upgradeType === "recording"
              ? limits.maxDailyRecordings
              : limits.maxParticipants
          }
        />
      </>
    );
  }

  return null;
}
